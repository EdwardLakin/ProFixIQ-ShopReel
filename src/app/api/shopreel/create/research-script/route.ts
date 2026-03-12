import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { buildCreatorResearchDraft } from "@/features/shopreel/creator/buildCreatorResearchDraft";
import { createContentPieceFromStoryDraft } from "@/features/shopreel/story-builder/createContentPieceFromStoryDraft";
import { saveStoryGeneration, saveStorySource } from "@/features/shopreel/story-sources/server";
import { generateCreatorScript } from "@/features/shopreel/creator/generateCreatorScript";
import type { StorySource } from "@/features/shopreel/story-sources";
import { createAdminClient } from "@/lib/supabase/server";

type Body = {
  mode?: "research_script" | "angle_pack" | "debunk" | "stitch";
  topic: string;
  audience?: string;
  platformFocus?: "instagram" | "tiktok" | "youtube" | "facebook" | "multi";
  tone?: "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy";
  sourceText?: string;
  sourceUrl?: string;
};

function scoreCreatorMode(mode: Body["mode"]) {
  switch (mode) {
    case "debunk":
      return 93;
    case "stitch":
      return 90;
    case "angle_pack":
      return 88;
    case "research_script":
    default:
      return 91;
  }
}

function reasonForMode(mode: Body["mode"]) {
  switch (mode) {
    case "debunk":
      return "Creator debunk opportunity ready for fast response content";
    case "stitch":
      return "Creator stitch opportunity ready for response content";
    case "angle_pack":
      return "Creator angle pack ready for multiple follow-up posts";
    case "research_script":
    default:
      return "Creator research opportunity ready for script generation";
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;
    const mode = body.mode ?? "research_script";

    if (!body.topic || body.topic.trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: "Topic required" },
        { status: 400 },
      );
    }

    const ai = await generateCreatorScript({
      mode,
      topic: body.topic,
      audience: body.audience ?? null,
      tone: body.tone ?? null,
      platformFocus: body.platformFocus ?? "multi",
      sourceText: body.sourceText ?? null,
      sourceUrl: body.sourceUrl ?? null,
    });

    const now = new Date().toISOString();

    const source: StorySource = {
      id: `creator:${Date.now()}`,
      shopId,
      title: body.topic.trim(),
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
      tags: ["creator_mode", mode],
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
        creatorModeType: mode,
        aiSummary: ai.summary,
        anglePack: ai.angles,
        sourceText: body.sourceText ?? null,
        sourceUrl: body.sourceUrl ?? null,
      },
      assets: [],
      refs: [],
      createdAt: now,
      updatedAt: now,
    };

    const savedSource = await saveStorySource(source);

    await legacy
      .from("shopreel_content_opportunities")
      .upsert(
        {
          shop_id: shopId,
          story_source_id: savedSource.id,
          score: scoreCreatorMode(mode),
          status: "ready",
          reason: reasonForMode(mode),
          metadata: {
            source_kind: "creator_idea",
            source_title: body.topic.trim(),
            source_origin: "creator_mode",
            creator_mode_type: mode,
            expanded_topic: ai.expandedTopic,
            angle_pack: ai.angles,
          },
        },
        {
          onConflict: "shop_id,story_source_id",
        },
      );

    const { data: creatorRequest } = await legacy
      .from("shopreel_creator_requests")
      .insert({
        shop_id: shopId,
        mode,
        status: mode === "angle_pack" ? "ready" : "draft",
        title: body.topic.trim(),
        topic: body.topic.trim(),
        audience: body.audience ?? null,
        tone: body.tone ?? null,
        platform_focus: body.platformFocus ?? "multi",
        source_story_source_id: savedSource.id,
        source_url: body.sourceUrl ?? null,
        request_payload: {
          mode,
          topic: body.topic,
          audience: body.audience ?? null,
          tone: body.tone ?? null,
          platformFocus: body.platformFocus ?? "multi",
          sourceText: body.sourceText ?? null,
          sourceUrl: body.sourceUrl ?? null,
        },
        result_payload: {
          expandedTopic: ai.expandedTopic,
          summary: ai.summary,
          bullets: ai.bullets,
          angles: ai.angles,
          script: {
            hook: ai.hook,
            context: ai.context,
            explanation: ai.explanation,
            takeaway: ai.takeaway,
            cta: ai.cta,
          },
        },
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (mode === "angle_pack") {
      return NextResponse.json({
        ok: true,
        mode,
        creatorRequestId: creatorRequest?.id ?? null,
        expandedTopic: ai.expandedTopic,
        researchSummary: ai.summary,
        researchBullets: ai.bullets,
        angles: ai.angles,
      });
    }

    const draft = buildCreatorResearchDraft({
      shopId,
      sourceId: savedSource.id,
      topic: body.topic,
      audience: body.audience ?? null,
      platformFocus: body.platformFocus ?? "multi",
      tone: body.tone ?? "confident",
      researchSummary: ai.summary,
      bullets: ai.bullets,
      hook: ai.hook,
      contextLine: ai.context,
      explanationLine: ai.explanation,
      takeawayLine: ai.takeaway,
      ctaLine: ai.cta,
      expandedTopic: ai.expandedTopic,
      mode,
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
        creator_mode_type: mode,
        creator_request_id: creatorRequest?.id ?? null,
        expanded_topic: ai.expandedTopic,
        research_summary: ai.summary,
        research_bullets: ai.bullets,
        generated_script: {
          hook: ai.hook,
          context: ai.context,
          explanation: ai.explanation,
          takeaway: ai.takeaway,
          cta: ai.cta,
        },
        angle_pack: ai.angles,
      },
    });

    await legacy
      .from("shopreel_creator_requests")
      .update({
        status: "generated",
        source_generation_id: generation.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creatorRequest?.id ?? "");

    return NextResponse.json({
      ok: true,
      mode,
      generationId: generation.id,
      editorUrl: `/shopreel/editor/${generation.id}`,
      expandedTopic: ai.expandedTopic,
      researchSummary: ai.summary,
      researchBullets: ai.bullets,
      angles: ai.angles,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "script generation failed";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
