import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { generateCreatorScript } from "@/features/shopreel/creator/generateCreatorScript";
import { buildCreatorResearchDraft } from "@/features/shopreel/creator/buildCreatorResearchDraft";
import { createContentPieceFromStoryDraft } from "@/features/shopreel/story-builder/createContentPieceFromStoryDraft";
import { saveStoryGeneration, saveStorySource } from "@/features/shopreel/story-sources/server";
import type { StorySource } from "@/features/shopreel/story-sources";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
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

    if (creatorRequest.source_generation_id) {
      return NextResponse.json({
        ok: true,
        generated: {
          creatorRequestId: creatorRequest.id,
          generationId: creatorRequest.source_generation_id,
        },
      });
    }

    const requestPayload =
      creatorRequest.request_payload &&
      typeof creatorRequest.request_payload === "object" &&
      !Array.isArray(creatorRequest.request_payload)
        ? creatorRequest.request_payload
        : {};

    const ai = await generateCreatorScript({
      mode: creatorRequest.mode ?? "research_script",
      topic: creatorRequest.topic ?? creatorRequest.title ?? "Creator prompt",
      audience: creatorRequest.audience ?? null,
      tone: creatorRequest.tone ?? null,
      platformFocus: creatorRequest.platform_focus ?? "multi",
      sourceText:
        typeof requestPayload.sourceText === "string" ? requestPayload.sourceText : null,
      sourceUrl: creatorRequest.source_url ?? null,
    });

    const now = new Date().toISOString();

    const source: StorySource = {
      id: `creator:${Date.now()}`,
      shopId,
      title: creatorRequest.title ?? creatorRequest.topic ?? "Creator prompt",
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
      tags: ["creator_mode", creatorRequest.mode ?? "research_script"],
      notes: ai.bullets,
      facts: {
        hook: ai.hook,
        context: ai.context,
        explanation: ai.explanation,
        takeaway: ai.takeaway,
        cta: ai.cta,
        expanded_topic: ai.expandedTopic,
      },
      metadata: {
        creatorMode: true,
        creatorRequestId: creatorRequest.id,
        anglePack: ai.angles,
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
      topic: creatorRequest.topic ?? creatorRequest.title ?? "Creator prompt",
      audience: creatorRequest.audience ?? null,
      platformFocus: creatorRequest.platform_focus ?? "multi",
      tone: creatorRequest.tone ?? "confident",
      researchSummary: ai.summary,
      bullets: ai.bullets,
      hook: ai.hook,
      contextLine: ai.context,
      explanationLine: ai.explanation,
      takeawayLine: ai.takeaway,
      ctaLine: ai.cta,
      expandedTopic: ai.expandedTopic,
      mode: creatorRequest.mode ?? "research_script",
    });

    const contentPiece = await createContentPieceFromStoryDraft({
      shopId,
      draft,
      sourceSystem: "creator_mode",
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
        expanded_topic: ai.expandedTopic,
        research_summary: ai.summary,
        research_bullets: ai.bullets,
        angle_pack: ai.angles,
      },
    });

    await legacy
      .from("shopreel_creator_requests")
      .update({
        source_story_source_id: savedSource.id,
        source_generation_id: generation.id,
        status: "ready",
        result_payload: {
          ...(creatorRequest.result_payload ?? {}),
          expandedTopic: ai.expandedTopic,
          summary: ai.summary,
          bullets: ai.bullets,
          angles: ai.angles,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", creatorRequest.id);

    return NextResponse.json({
      ok: true,
      generated: {
        creatorRequestId: creatorRequest.id,
        generationId: generation.id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate from creator request";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
