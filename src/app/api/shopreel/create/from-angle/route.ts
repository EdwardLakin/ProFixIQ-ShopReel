import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { buildCreatorResearchDraft } from "@/features/shopreel/creator/buildCreatorResearchDraft";
import { createContentPieceFromStoryDraft } from "@/features/shopreel/story-builder/createContentPieceFromStoryDraft";
import { saveStoryGeneration, saveStorySource } from "@/features/shopreel/story-sources/server";
import type { StorySource } from "@/features/shopreel/story-sources";

type Angle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

type Body = {
  creatorRequestId?: string | null;
  topic: string;
  audience?: string | null;
  platformFocus?: "instagram" | "tiktok" | "youtube" | "facebook" | "multi" | null;
  tone?: "professional" | "educational" | "friendly" | "direct" | "confident" | "high-energy" | null;
  expandedTopic?: string | null;
  researchSummary?: string | null;
  researchBullets?: string[] | null;
  angle: Angle;
};

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    if (!body.topic || body.topic.trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: "Topic required" },
        { status: 400 },
      );
    }

    if (!body.angle || !body.angle.title || !body.angle.hook) {
      return NextResponse.json(
        { ok: false, error: "Angle required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const bullets = safeStringArray(body.researchBullets).slice(0, 6);
    const title = `${body.topic.trim()} — ${body.angle.title}`;

    const source: StorySource = {
      id: `creator-angle:${Date.now()}`,
      shopId,
      title,
      description: body.angle.angle,
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
      tags: ["creator_mode", "angle_post"],
      notes: bullets.length > 0 ? bullets : [body.angle.angle, body.angle.whyItWorks],
      facts: {
        hook: body.angle.hook,
        contentType: "creator_angle_post",
        expanded_topic: body.expandedTopic ?? body.topic,
        selected_angle_title: body.angle.title,
      },
      metadata: {
        creatorMode: true,
        creatorModeType: "angle_post",
        creatorRequestId: body.creatorRequestId ?? null,
        selectedAngle: body.angle,
        expandedTopic: body.expandedTopic ?? body.topic,
      },
      assets: [],
      refs: body.creatorRequestId
        ? [
            {
              type: "content_piece",
              id: body.creatorRequestId,
            },
          ]
        : [],
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
          score: 92,
          status: "ready",
          reason: "Angle-derived creator post ready for generation",
          metadata: {
            source_type: "creator_request",
            creator_request_id: body.creatorRequestId ?? null,
            creator_mode: "angle_post",
            creator_title: title,
            selected_angle: body.angle,
            expanded_topic: body.expandedTopic ?? body.topic,
          },
        },
        {
          onConflict: "shop_id,story_source_id",
        },
      );

    const draft = buildCreatorResearchDraft({
      shopId,
      sourceId: savedSource.id,
      topic: title,
      audience: body.audience ?? null,
      platformFocus: body.platformFocus ?? "multi",
      tone: body.tone ?? "confident",
      researchSummary: body.researchSummary ?? body.angle.angle,
      bullets,
      hook: body.angle.hook,
      contextLine: body.angle.angle,
      explanationLine: body.angle.whyItWorks,
      takeawayLine:
        bullets[0] ??
        `This angle works because it focuses the viewer on ${body.expandedTopic ?? body.topic}.`,
      ctaLine: body.angle.suggestedCta || "Follow for more updates.",
      expandedTopic: body.expandedTopic ?? body.topic,
      mode: "research_script",
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
        creator_mode_type: "angle_post",
        creator_request_id: body.creatorRequestId ?? null,
        selected_angle: body.angle,
        expanded_topic: body.expandedTopic ?? body.topic,
        research_summary: body.researchSummary ?? body.angle.angle,
        research_bullets: bullets,
      },
    });

    if (body.creatorRequestId) {
      const { data: request } = await legacy
        .from("shopreel_creator_requests")
        .select("result_payload")
        .eq("id", body.creatorRequestId)
        .eq("shop_id", shopId)
        .maybeSingle();

      const resultPayload =
        request?.result_payload && typeof request.result_payload === "object" && !Array.isArray(request.result_payload)
          ? request.result_payload
          : {};

      const derivedPosts = Array.isArray((resultPayload as any).derivedPosts)
        ? (resultPayload as any).derivedPosts
        : [];

      await legacy
        .from("shopreel_creator_requests")
        .update({
          updated_at: now,
          result_payload: {
            ...resultPayload,
            derivedPosts: [
              ...derivedPosts,
              {
                title,
                generationId: generation.id,
                storySourceId: savedSource.id,
                createdAt: now,
                angleTitle: body.angle.title,
              },
            ],
          },
        })
        .eq("id", body.creatorRequestId)
        .eq("shop_id", shopId);
    }

    return NextResponse.json({
      ok: true,
      generationId: generation.id,
      editorUrl: `/shopreel/editor/${generation.id}`,
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
