import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  DEFAULT_SHOPREEL_PLATFORM_IDS,
  SHOPREEL_PLATFORM_PRESETS,
  type ShopReelPlatformId,
} from "@/features/shopreel/platforms/presets";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { openai } from "@/features/ai/server/openai";
import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";
import {
  assertManualAssetAccess,
  buildCreativeBrief,
  extractScreenshotContext,
  type CreativeBrief,
} from "@/features/shopreel/manual/lib/creativeBrief";

type Body = {
  idea?: string;
  prompt?: string;
  audience?: string;
  platformFocus?: "instagram" | "tiktok" | "youtube" | "facebook" | "multi";
  tone?: "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy";
  platformIds?: ShopReelPlatformId[];
  manualAssetId?: string | null;
};

type PlatformOutput = {
  hook: string;
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
};

type GeneratedDraftPayload = {
  title: string;
  hook: string;
  summary: string;
  cta: string;
  caption: string;
  scriptText: string;
  voiceoverText: string;
  platformOutputs: Partial<Record<ShopReelPlatformId, PlatformOutput>>;
  alternateHooks: string[];
};

const PLATFORM_ID_SET = new Set<ShopReelPlatformId>(
  SHOPREEL_PLATFORM_PRESETS.map((platform) => platform.id),
);

function makeId(prefix: string) {
  return `${prefix}:${crypto.randomUUID()}`;
}

function similarity(a: string, b: string): number {
  const aTokens = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const bTokens = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(aTokens.size, bTokens.size);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
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

function defaultHashtags(platformId: ShopReelPlatformId, brief: CreativeBrief): string[] {
  const productToken = brief.productName
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();

  if (platformId === "instagram_reels") {
    return [
      productToken ? `#${productToken}` : "#productlaunch",
      "#flatratetech",
      "#automotivetech",
      "#mechaniclife",
      "#payday",
      "#shoplife",
    ];
  }

  if (platformId === "tiktok") {
    return ["#flatratetech", "#mechaniclife", "#worktok", "#payday"];
  }

  if (platformId === "youtube_shorts") {
    return ["#Shorts", "#mechaniclife", "#payday"];
  }

  return [];
}

function strengthenCta(platformId: ShopReelPlatformId, cta: string, brief: CreativeBrief): string {
  const normalized = cta.trim();

  if (
    !normalized ||
    /drive awareness|learn more about|prompt technicians|not provided/i.test(normalized)
  ) {
    if (platformId === "instagram_reels") {
      return `DM “${brief.productName || "INFO"}” for early access or save this before payday.`;
    }

    if (platformId === "facebook_reels") {
      return `Comment or message us to see how ${brief.productName || "this"} helps techs keep payday proof organized.`;
    }

    return "Save this and create your first proof trail before payday.";
  }

  return normalized;
}

function ensureDistinctPlatformTone(input: {
  platformId: ShopReelPlatformId;
  output: PlatformOutput;
  brief: CreativeBrief;
}): PlatformOutput {
  const { platformId, output, brief } = input;
  const cta = strengthenCta(platformId, output.cta, brief);
  const hashtags = output.hashtags.length > 0 ? output.hashtags : defaultHashtags(platformId, brief);

  if (platformId === "instagram_reels") {
    return {
      ...output,
      hook: output.hook.length > 80 ? output.hook.slice(0, 77).trim() + "..." : output.hook,
      body:
        output.body ||
        `${brief.primaryPainPoint} ${brief.primaryValueProp}`.trim(),
      cta,
      caption:
        output.caption ||
        [output.hook, output.body, cta, hashtags.join(" ")].filter(Boolean).join("\n\n"),
      hashtags,
    };
  }

  if (platformId === "facebook_reels") {
    return {
      ...output,
      body:
        output.body && output.body.length > 80
          ? output.body
          : `${brief.positioningSummary}\n\n${brief.primaryValueProp}\n\n${brief.emotionalPromise}`.trim(),
      cta,
      caption:
        output.caption ||
        [output.hook, output.body, cta].filter(Boolean).join("\n\n"),
      hashtags,
    };
  }

  return {
    ...output,
    cta,
    hashtags,
  };
}

function normalizeGeneratedPayload(value: unknown, brief: CreativeBrief, platformIds: ShopReelPlatformId[]): GeneratedDraftPayload {
  const record = asRecord(value);
  const fallbackHook = brief.alternateHooks[0] ?? "Turn proof into confidence.";
  const fallbackCta = brief.ctaGoal || "Learn more.";
  const fallbackCaption = `${brief.positioningSummary}\n\n${fallbackCta}`;

  const platformOutputsRaw = asRecord(record.platformOutputs);
  const platformOutputs: Partial<Record<ShopReelPlatformId, PlatformOutput>> = {};

  for (const platformId of platformIds) {
    const isInstagram = platformId === "instagram_reels";
    const fallback: PlatformOutput = {
      hook: fallbackHook,
      body: isInstagram
        ? `${brief.primaryValueProp} ${brief.emotionalPromise}`.trim()
        : `${brief.positioningSummary} ${brief.primaryValueProp}`.trim(),
      cta: fallbackCta,
      caption: fallbackCaption,
      hashtags: isInstagram ? ["#contentmarketing", "#productlaunch", "#smallbusiness"] : [],
    };
    platformOutputs[platformId] = ensureDistinctPlatformTone({
      platformId,
      output: normalizePlatformOutput(platformOutputsRaw[platformId], fallback),
      brief,
    });
  }

  return {
    title: asString(record.title, brief.productName),
    hook: asString(record.hook, fallbackHook),
    summary: asString(record.summary, brief.positioningSummary),
    cta: asString(record.cta, fallbackCta),
    caption: asString(record.caption, fallbackCaption),
    scriptText: asString(record.scriptText, brief.positioningSummary),
    voiceoverText: asString(record.voiceoverText, brief.positioningSummary),
    platformOutputs,
    alternateHooks: asStringArray(record.alternateHooks).length > 0
      ? asStringArray(record.alternateHooks)
      : brief.alternateHooks,
  };
}

async function generateDraftFromBrief(input: {
  idea: string;
  audience: string;
  platformIds: ShopReelPlatformId[];
  tone: string;
  brief: CreativeBrief;
  shopId: string;
  sourceId: string;
  platformFocus: NonNullable<Body["platformFocus"]>;
}) {
  const response = await openai.responses.create({
    model: SHOPREEL_AI_MODELS.text,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Return one valid JSON object only. Do not wrap it in markdown. Do not include commentary. Create launch-ready social copy from the creative brief. " +
              "Do not repeat the original user prompt verbatim. Write original polished marketing copy. " +
              "Instagram and Facebook must be meaningfully different when both are requested. " +
              "Instagram should be hook-first, punchy, shorter, CTA-forward, and include hashtags. " +
              "Facebook should be more explanatory, practical, trust-building, and use fewer or no hashtags. " +
              "Use screenshot context as factual support only. Do not invent unsupported product features.",
          },
          { type: "input_text", text: `Original user prompt, for context only: ${input.idea}` },
          { type: "input_text", text: `Creative brief: ${JSON.stringify(input.brief)}` },
          { type: "input_text", text: `Requested platform IDs: ${input.platformIds.join(", ")}` },
        ],
      },
    ],
    text: {
      format: { type: "json_object" },
    },
  });

  let parsed: GeneratedDraftPayload;
  try {
    parsed = normalizeGeneratedPayload(JSON.parse(response.output_text || "{}") as unknown, input.brief, input.platformIds);
  } catch {
    parsed = normalizeGeneratedPayload({}, input.brief, input.platformIds);
  }

  if (similarity(parsed.hook, input.idea) > 0.72 || similarity(parsed.caption, input.idea) > 0.72) {
    parsed.hook = input.brief.alternateHooks[0] ?? "Your work deserves proof.";
    parsed.caption = `${input.brief.positioningSummary}\n\n${input.brief.ctaGoal}`.trim();
  }

  const instagram = parsed.platformOutputs.instagram_reels;
  const facebook = parsed.platformOutputs.facebook_reels;
  if (
    instagram &&
    facebook &&
    similarity(
      `${instagram.hook} ${instagram.body} ${instagram.caption}`,
      `${facebook.hook} ${facebook.body} ${facebook.caption}`,
    ) > 0.8
  ) {
    parsed.platformOutputs.facebook_reels = {
      ...facebook,
      body: `${facebook.body}\n\nFor teams and technicians, the value is simple: clearer records, fewer payday surprises, and a practical way to talk through missing pay with evidence.`,
      hashtags: [],
    };
  }

  const targetChannels =
    input.platformFocus === "instagram"
      ? ["instagram_reel"]
      : input.platformFocus === "tiktok"
        ? ["tiktok_video"]
        : input.platformFocus === "youtube"
          ? ["youtube_short"]
          : input.platformFocus === "facebook"
            ? ["facebook_video"]
            : ["instagram_reel", "tiktok_video", "youtube_short", "facebook_video"];

  return {
    id: makeId("draft"),
    shopId: input.shopId,
    sourceId: input.sourceId,
    sourceKind: "creator_idea",
    title: parsed.title,
    hook: parsed.hook,
    caption: parsed.caption,
    cta: parsed.cta,
    hashtags: [],
    tone: input.tone,
    targetChannels,
    targetDurationSeconds: 21,
    summary: parsed.summary,
    voiceoverText: parsed.voiceoverText,
    scriptText: parsed.scriptText,
    scenes: [],
    metadata: {
      creatorMode: true,
      audience: input.audience.trim() || null,
      platformFocus: input.platformFocus,
      sourceOrigin: "creator_mode",
      creativeBrief: input.brief,
      positioningSummary: input.brief.positioningSummary,
      alternateHooks: parsed.alternateHooks,
    },
    platformOutputs: parsed.platformOutputs,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const idea = (body.prompt ?? body.idea ?? "").trim();
    const audience = body.audience?.trim() ?? "";

    if (!idea) {
      return NextResponse.json({ ok: false, error: "prompt is required" }, { status: 400 });
    }

    const authSupabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to create content." },
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
    const submittedPlatformIds = body.platformIds ?? [];
    const platformIds = submittedPlatformIds.filter((id): id is ShopReelPlatformId =>
      PLATFORM_ID_SET.has(id),
    );
    const normalizedPlatformIds =
      platformIds.length > 0 ? platformIds : DEFAULT_SHOPREEL_PLATFORM_IDS;

    if (body.manualAssetId) {
      await assertManualAssetAccess({
        manualAssetId: body.manualAssetId,
        userId: user.id,
        shopId,
      });
    }

    const now = new Date().toISOString();
    const sourceId = crypto.randomUUID();
    const contentPieceId = shopId ? crypto.randomUUID() : null;
    const generationId = crypto.randomUUID();

    const screenshotContext = body.manualAssetId
      ? await extractScreenshotContext({
          manualAssetId: body.manualAssetId,
          userId: user.id,
          shopId,
        }).catch(() => null)
      : null;

    const creativeBrief = await buildCreativeBrief({
      prompt: idea,
      audience,
      platformIds: normalizedPlatformIds,
      tone: body.tone ?? "confident",
      screenshotContext,
    });

    const draft = await generateDraftFromBrief({
      shopId: shopId ?? user.id,
      sourceId,
      idea,
      audience,
      tone: body.tone ?? "confident",
      platformFocus: body.platformFocus ?? "multi",
      platformIds: normalizedPlatformIds,
      brief: creativeBrief,
    });

    const { error: sourceError } = await supabase
      .from("shopreel_story_sources")
      .insert({
        id: sourceId,
        shop_id: shopId,
        title: draft.title,
        description: idea,
        kind: "creator_idea",
        origin: "creator_mode",
        generation_mode: "assisted",
        tags: ["creator", "idea"],
        metadata: {
          creatorMode: true,
          audience: audience || null,
          platformFocus: body.platformFocus ?? "multi",
          platformIds: normalizedPlatformIds,
          manualAssetId: body.manualAssetId ?? null,
          creativeBrief,
          screenshotContext,
        },
        created_at: now,
        updated_at: now,
      });

    if (sourceError) throw new Error(`Failed to create story source: ${sourceError.message}`);

    if (shopId && contentPieceId) {
      const { error: contentPieceError } = await supabase
        .from("content_pieces")
        .insert({
          id: contentPieceId,
          tenant_shop_id: shopId,
          source_shop_id: shopId,
          source_system: "shopreel",
          title: draft.title,
          hook: draft.hook,
          caption: draft.caption,
          cta: draft.cta,
          script_text: draft.scriptText,
          voiceover_text: draft.voiceoverText,
          status: "draft",
          content_type: "creator_story",
          metadata: {
            creatorMode: true,
            source_kind: "creator_idea",
          },
          platform_targets: draft.targetChannels,
          created_at: now,
          updated_at: now,
        });

      if (contentPieceError) throw new Error(`Failed to create content piece: ${contentPieceError.message}`);
    }

    const { error: generationError } = await supabase
      .from("shopreel_story_generations")
      .insert({
        id: generationId,
        shop_id: shopId,
        story_source_id: sourceId,
        content_piece_id: contentPieceId,
        reel_plan_id: null,
        render_job_id: null,
        status: "draft",
        story_draft: draft,
        generation_metadata: {
          creatorMode: true,
          source_system: "shopreel",
          audience: audience || null,
          platformFocus: body.platformFocus ?? "multi",
          platformIds: normalizedPlatformIds,
          manualAssetId: body.manualAssetId ?? null,
          creativeBrief,
          screenshotContext,
          positioningSummary: creativeBrief.positioningSummary,
          alternateHooks: draft.metadata.alternateHooks,
        },
        created_by: user.id,
        created_at: now,
        updated_at: now,
      });

    if (generationError) throw new Error(`Failed to create generation: ${generationError.message}`);

    return NextResponse.json({
      ok: true,
      sourceId,
      contentPieceId,
      generationId,
      editorUrl: getEditorPath("video", generationId),
      reviewUrl: `/shopreel/review/${generationId}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create from idea";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
