import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { openai } from "@/features/ai/server/openai";
import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";
import type { Database, Json } from "@/types/supabase";

type PlatformOutput = {
  hook: string;
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
};

type RefinePayload = {
  title?: string;
  hook?: string;
  summary?: string;
  cta?: string;
  caption?: string;
  scriptText?: string;
  voiceoverText?: string;
  platformOutputs: Record<string, PlatformOutput>;
  alternateHooks?: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function normalizePlatformOutput(value: unknown, fallback: PlatformOutput): PlatformOutput {
  const record = asRecord(value);
  return {
    hook: asString(record.hook, fallback.hook),
    body: asString(record.body, fallback.body),
    cta: asString(record.cta, fallback.cta),
    caption: asString(record.caption, fallback.caption),
    hashtags: asStringArray(record.hashtags),
  };
}

function normalizeRefinePayload(value: unknown, currentDraft: Record<string, unknown>): RefinePayload {
  const record = asRecord(value);
  const currentOutputs = asRecord(currentDraft.platformOutputs);
  const rawOutputs = asRecord(record.platformOutputs);
  const platformOutputs: Record<string, PlatformOutput> = {};

  for (const [platformId, rawCurrent] of Object.entries(currentOutputs)) {
    const current = asRecord(rawCurrent);
    const fallback: PlatformOutput = {
      hook: asString(current.hook),
      body: asString(current.body),
      cta: asString(current.cta),
      caption: asString(current.caption),
      hashtags: asStringArray(current.hashtags),
    };

    platformOutputs[platformId] = normalizePlatformOutput(rawOutputs[platformId], fallback);
  }

  return {
    title: asString(record.title, asString(currentDraft.title)),
    hook: asString(record.hook, asString(currentDraft.hook)),
    summary: asString(record.summary, asString(currentDraft.summary)),
    cta: asString(record.cta, asString(currentDraft.cta)),
    caption: asString(record.caption, asString(currentDraft.caption)),
    scriptText: asString(record.scriptText, asString(currentDraft.scriptText)),
    voiceoverText: asString(record.voiceoverText, asString(currentDraft.voiceoverText)),
    platformOutputs,
    alternateHooks: asStringArray(record.alternateHooks),
  };
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { instruction?: unknown };
    const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";

    if (!instruction) {
      return NextResponse.json(
        { ok: false, error: "Tell ShopReel what to change." },
        { status: 400 },
      );
    }

    const authSupabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to refine this draft." },
        { status: 401 },
      );
    }

    let shopId: string | null = null;
    try {
      shopId = await getCurrentShopId();
    } catch {
      shopId = null;
    }

    const supabase = createAdminClient();

    const { data: generation, error: generationError } = await supabase
      .from("shopreel_story_generations")
      .select("id, shop_id, story_draft, generation_metadata, created_by")
      .eq("id", id)
      .maybeSingle();

    if (generationError) throw new Error(generationError.message);
    if (!generation) {
      return NextResponse.json({ ok: false, error: "Draft not found." }, { status: 404 });
    }

    const isOwner = generation.created_by === user.id;
    const isSameShop = Boolean(shopId && generation.shop_id === shopId);

    if (!isOwner && !isSameShop) {
      return NextResponse.json({ ok: false, error: "Draft not found." }, { status: 404 });
    }

    const currentDraft = asRecord(generation.story_draft);
    const currentMetadata = asRecord(generation.generation_metadata);
    const currentOutputs = asRecord(currentDraft.platformOutputs);

    if (Object.keys(currentOutputs).length === 0) {
      return NextResponse.json(
        { ok: false, error: "This draft does not have platform outputs to refine yet." },
        { status: 400 },
      );
    }

    const response = await openai.responses.create({
      model: SHOPREEL_AI_MODELS.text,
      input: [
        {
          role: "system",
          content:
            "You refine ShopReel social content. Keep the same product facts and platform IDs. " +
            "Apply the user's instruction clearly. Return JSON only. Do not invent unsupported product features.",
        },
        {
          role: "user",
          content:
            "Refine this draft according to the instruction.\n\n" +
            JSON.stringify({
              instruction,
              currentDraft,
              currentMetadata,
            }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "shopreel_refined_platform_outputs",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              hook: { type: "string" },
              summary: { type: "string" },
              cta: { type: "string" },
              caption: { type: "string" },
              scriptText: { type: "string" },
              voiceoverText: { type: "string" },
              platformOutputs: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    hook: { type: "string" },
                    body: { type: "string" },
                    cta: { type: "string" },
                    caption: { type: "string" },
                    hashtags: { type: "array", items: { type: "string" } },
                  },
                  required: ["hook", "body", "cta", "caption", "hashtags"],
                },
              },
              alternateHooks: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "title",
              "hook",
              "summary",
              "cta",
              "caption",
              "scriptText",
              "voiceoverText",
              "platformOutputs",
              "alternateHooks",
            ],
          },
        },
      },
    });

    const refined = normalizeRefinePayload(
      JSON.parse(response.output_text || "{}") as unknown,
      currentDraft,
    );

    const nextDraft: Record<string, unknown> = {
      ...currentDraft,
      title: refined.title,
      hook: refined.hook,
      summary: refined.summary,
      cta: refined.cta,
      caption: refined.caption,
      scriptText: refined.scriptText,
      voiceoverText: refined.voiceoverText,
      platformOutputs: refined.platformOutputs,
      metadata: {
        ...asRecord(currentDraft.metadata),
        alternateHooks: refined.alternateHooks ?? [],
        lastRefinementInstruction: instruction,
      },
    };

    const existingHistory = Array.isArray(currentMetadata.refinementHistory)
      ? currentMetadata.refinementHistory
      : [];

    const nextMetadata: Record<string, Json | undefined> = {
      ...(currentMetadata as Record<string, Json | undefined>),
      alternateHooks: (refined.alternateHooks ?? []) as Json,
      refinementHistory: [
        ...existingHistory.slice(-9),
        {
          instruction,
          refinedAt: new Date().toISOString(),
        },
      ] as Json,
    };

    const updatePayload: Database["public"]["Tables"]["shopreel_story_generations"]["Update"] = {
      story_draft: nextDraft as Json,
      generation_metadata: nextMetadata as Json,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("shopreel_story_generations")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      ok: true,
      generationId: id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to refine draft.",
      },
      { status: 500 },
    );
  }
}
