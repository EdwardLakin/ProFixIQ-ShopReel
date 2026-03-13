import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { saveStoryGeneration, saveStorySource } from "@/features/shopreel/story-sources/server";
import { createContentPieceFromStoryDraft } from "@/features/shopreel/story-builder/createContentPieceFromStoryDraft";
import { buildCreatorResearchDraft } from "@/features/shopreel/creator/buildCreatorResearchDraft";
import { generateCreatorScript } from "@/features/shopreel/creator/generateCreatorScript";
import { generateCreatorContentOutputs } from "@/features/shopreel/creator/generateCreatorContentOutputs";
import {
  editorUrlForOutputType,
  normalizeBlogLengthMode,
  normalizeBlogStyle,
  normalizeOutputType,
  type OutputType,
  type BlogStyle,
  type BlogLengthMode,
} from "@/features/shopreel/creator/buildCreatorOutputs";
import type { StorySource } from "@/features/shopreel/story-sources";

type Body = {
  outputType?: OutputType;
  blogStyle?: BlogStyle;
  blogLengthMode?: BlogLengthMode;
};

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

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

    const requestPayload = objectRecord(creatorRequest.request_payload);
    const resultPayload = objectRecord(creatorRequest.result_payload);
    const angles = Array.isArray(resultPayload.angles) ? resultPayload.angles : [];
    const rawAngle = angles[angleIndex];

    if (!rawAngle || typeof rawAngle !== "object" || Array.isArray(rawAngle)) {
      return NextResponse.json(
        { ok: false, error: "Angle not found" },
        { status: 404 },
      );
    }

    const angle = rawAngle as {
      title?: string;
      angle?: string;
      hook?: string;
      whyItWorks?: string;
      suggestedCta?: string;
    };

    const outputType = normalizeOutputType(body.outputType ?? requestPayload.outputType);
    const blogStyle = normalizeBlogStyle(body.blogStyle ?? requestPayload.blogStyle);
    const blogLengthMode = normalizeBlogLengthMode(
      body.blogLengthMode ?? requestPayload.blogLengthMode,
    );

    const topicBase = creatorRequest.topic ?? creatorRequest.title ?? "Creator request";
    const topic = `${topicBase} — ${angle.title ?? `Angle ${angleIndex + 1}`}`;

    const ai = await generateCreatorScript({
      mode: creatorRequest.mode ?? "research_script",
      topic,
      audience: creatorRequest.audience ?? null,
      tone: creatorRequest.tone ?? null,
      platformFocus: creatorRequest.platform_focus ?? "multi",
      sourceText:
        typeof requestPayload.sourceText === "string" ? requestPayload.sourceText : null,
      sourceUrl: creatorRequest.source_url ?? null,
    });

    const now = new Date().toISOString();

    const source: StorySource = {
      id: `creator-angle:${Date.now()}`,
      shopId,
      title: topic,
      description: ai.summary,
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
      tags: [
        "creator_mode",
        creatorRequest.mode ?? "research_script",
        "derived_angle",
        outputType,
      ],
      notes: ai.bullets,
      facts: {
        hook: angle.hook ?? ai.hook,
        context: ai.context,
        explanation: ai.explanation,
        takeaway: ai.takeaway,
        cta: angle.suggestedCta ?? ai.cta,
        expanded_topic: ai.expandedTopic,
      },
      metadata: {
        creatorMode: true,
        creatorRequestId: creatorRequest.id,
        derivedFromAngleIndex: angleIndex,
        derivedFromAngleTitle: angle.title ?? null,
        derivedFromAngleDescription: angle.angle ?? null,
        outputType,
        blogStyle,
        blogLengthMode,
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
      topic,
      audience: creatorRequest.audience ?? null,
      platformFocus: creatorRequest.platform_focus ?? "multi",
      tone: creatorRequest.tone ?? "confident",
      researchSummary: ai.summary,
      bullets: ai.bullets,
      hook: angle.hook ?? ai.hook,
      contextLine: ai.context,
      explanationLine: ai.explanation,
      takeawayLine: ai.takeaway,
      ctaLine: angle.suggestedCta ?? ai.cta,
      expandedTopic: ai.expandedTopic,
      mode: creatorRequest.mode ?? "research_script",
    });

    const contentPiece = await createContentPieceFromStoryDraft({
      shopId,
      draft,
      sourceSystem: "creator_mode",
    });

    const textOutputs = await generateCreatorContentOutputs({
      topic,
      summary: ai.summary,
      bullets: ai.bullets,
      hook: angle.hook ?? ai.hook,
      context: ai.context,
      explanation: ai.explanation,
      takeaway: ai.takeaway,
      cta: angle.suggestedCta ?? ai.cta,
      angleTitle: angle.title ?? null,
      angleDescription: angle.angle ?? null,
      audience: creatorRequest.audience ?? null,
      blogStyle,
      blogLengthMode,
    });

    const generation = await saveStoryGeneration({
      shopId,
      storySourceId: savedSource.id,
      contentPieceId: contentPiece.id,
      draft,
      status: "draft",
      metadata: {
        creator_mode: true,
        creator_mode_type: creatorRequest.mode ?? "research_script",
        creator_request_id: creatorRequest.id,
        output_type: outputType,
        blog_style: blogStyle,
        blog_length_mode: blogLengthMode,
        text_outputs: textOutputs,
        derived_from_angle_index: angleIndex,
        derived_from_angle_title: angle.title ?? null,
        derived_from_angle_description: angle.angle ?? null,
        expanded_topic: ai.expandedTopic,
        research_summary: ai.summary,
        research_bullets: ai.bullets,
      },
    });

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
