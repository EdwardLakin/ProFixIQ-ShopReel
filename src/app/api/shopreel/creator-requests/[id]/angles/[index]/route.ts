import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { buildCreatorResearchDraft } from "@/features/shopreel/creator/buildCreatorResearchDraft";
import { createContentPieceFromStoryDraft } from "@/features/shopreel/story-builder/createContentPieceFromStoryDraft";
import { saveStoryGeneration, saveStorySource } from "@/features/shopreel/story-sources/server";
import type { StorySource } from "@/features/shopreel/story-sources";
import {
  buildCreatorTextOutputs,
  editorUrlForOutputType,
  normalizeOutputType,
  type OutputType,
} from "@/features/shopreel/creator/buildCreatorOutputs";

type Body = {
  outputType?: OutputType;
};

type Angle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; index: string }> },
) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const { id, index } = await ctx.params;
    const angleIndex = Number(index);

    if (!Number.isInteger(angleIndex) || angleIndex < 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid angle index" },
        { status: 400 },
      );
    }

    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: creatorRequest, error } = await legacy
      .from("shopreel_creator_requests")
      .select("*")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!creatorRequest) {
      return NextResponse.json(
        { ok: false, error: "Creator request not found" },
        { status: 404 },
      );
    }

    const resultPayload =
      creatorRequest.result_payload &&
      typeof creatorRequest.result_payload === "object" &&
      !Array.isArray(creatorRequest.result_payload)
        ? creatorRequest.result_payload
        : {};

    const angles = Array.isArray((resultPayload as { angles?: unknown }).angles)
      ? (((resultPayload as { angles?: unknown[] }).angles ?? []) as unknown[])
      : [];

    const rawAngle = angles[angleIndex];
    if (!rawAngle || typeof rawAngle !== "object" || Array.isArray(rawAngle)) {
      return NextResponse.json(
        { ok: false, error: "Angle not found" },
        { status: 404 },
      );
    }

    const angle = rawAngle as Angle;
    const outputType = normalizeOutputType(body.outputType);

    const now = new Date().toISOString();
    const baseTopic = creatorRequest.topic ?? creatorRequest.title ?? "Creator angle";
    const generationTitle = `${baseTopic} — ${angle.title}`;

    const source: StorySource = {
      id: `creator-angle:${Date.now()}`,
      shopId,
      title: generationTitle,
      description: angle.angle,
      kind: "creator_idea",
      origin: "creator_mode",
      generationMode: "manual",
      occurredAt: now,
      startedAt: null,
      endedAt: null,
      projectId: null,
      projectName: null,
      vehicleLabel: null,
      customerLabel: null,
      technicianLabel: null,
      tags: ["creator_mode", "angle_post", creatorRequest.mode ?? "angle_pack", outputType],
      notes: [angle.angle, angle.whyItWorks],
      facts: {
        hook: angle.hook,
        explanation: angle.whyItWorks,
        cta: angle.suggestedCta,
        creator_request_id: creatorRequest.id,
        angle_index: angleIndex,
      },
      metadata: {
        creatorMode: true,
        creatorRequestId: creatorRequest.id,
        angleIndex,
        angleTitle: angle.title,
        outputType,
      },
      assets: [],
      refs: [],
      createdAt: now,
      updatedAt: now,
    };

    const savedSource = await saveStorySource(source);

    const draft = buildCreatorResearchDraft({
      shopId,
      sourceId: savedSource.id,
      topic: generationTitle,
      audience: creatorRequest.audience ?? null,
      platformFocus: creatorRequest.platform_focus ?? "multi",
      tone: creatorRequest.tone ?? "confident",
      researchSummary:
        typeof (resultPayload as { summary?: unknown }).summary === "string"
          ? ((resultPayload as { summary?: string }).summary ?? angle.angle)
          : angle.angle,
      bullets: [
        angle.angle,
        angle.whyItWorks,
        `CTA: ${angle.suggestedCta}`,
      ],
      hook: angle.hook,
      contextLine: angle.angle,
      explanationLine: angle.whyItWorks,
      takeawayLine: angle.angle,
      ctaLine: angle.suggestedCta,
      expandedTopic:
        typeof (resultPayload as { expandedTopic?: unknown }).expandedTopic === "string"
          ? ((resultPayload as { expandedTopic?: string }).expandedTopic ?? generationTitle)
          : generationTitle,
      mode: "angle_pack",
    });

    const contentPiece = await createContentPieceFromStoryDraft({
      shopId,
      draft,
      sourceSystem: "creator_mode",
    });

    const textOutputs = buildCreatorTextOutputs({
      topic: generationTitle,
      summary: angle.angle,
      bullets: [angle.angle, angle.whyItWorks],
      hook: angle.hook,
      context: angle.angle,
      explanation: angle.whyItWorks,
      takeaway: angle.angle,
      cta: angle.suggestedCta,
      angleTitle: angle.title,
      angleDescription: angle.angle,
      audience: creatorRequest.audience ?? null,
    });

    const generation = await saveStoryGeneration({
      shopId,
      storySourceId: savedSource.id,
      contentPieceId: contentPiece.id,
      draft,
      status: "draft",
      metadata: {
        creator_mode: true,
        creator_mode_type: "angle_post",
        creator_request_id: creatorRequest.id,
        output_type: outputType,
        angle_index: angleIndex,
        angle_title: angle.title,
        text_outputs: textOutputs,
      },
    });

    const existingDerivedPosts = Array.isArray((resultPayload as { derivedPosts?: unknown }).derivedPosts)
      ? (((resultPayload as { derivedPosts?: unknown[] }).derivedPosts ?? []) as Array<Record<string, unknown>>)
      : [];

    const nextDerivedPosts = [
      ...existingDerivedPosts,
      {
        title: generationTitle,
        generationId: generation.id,
        createdAt: now,
        angleTitle: angle.title,
      },
    ];

    await legacy
      .from("shopreel_creator_requests")
      .update({
        status: "ready",
        result_payload: {
          ...(resultPayload ?? {}),
          derivedPosts: nextDerivedPosts,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", creatorRequest.id);

    return NextResponse.json({
      ok: true,
      generated: {
        creatorRequestId: creatorRequest.id,
        generationId: generation.id,
        editorUrl: editorUrlForOutputType(outputType, generation.id),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create from angle";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
