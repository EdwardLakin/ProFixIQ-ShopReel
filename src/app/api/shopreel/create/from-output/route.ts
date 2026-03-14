import { NextResponse } from "next/server";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { buildCreatorResearchDraft } from "@/features/shopreel/creator/buildCreatorResearchDraft";
import { createContentPieceFromStoryDraft } from "@/features/shopreel/story-builder/createContentPieceFromStoryDraft";
import { saveStoryGeneration, saveStorySource } from "@/features/shopreel/story-sources/server";
import type { StorySource } from "@/features/shopreel/story-sources";

type OutputType = "video" | "blog" | "email" | "post";

type Angle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

type Body = {
  creatorRequestId?: string | null;
  outputType: OutputType;
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

function routeForOutput(outputType: OutputType, generationId: string) {
  if (outputType === "video") return `/shopreel/editor/video/${generationId}`;
  if (outputType === "blog") return `/shopreel/editor/blog/${generationId}`;
  if (outputType === "email") return `/shopreel/editor/email/${generationId}`;
  return `/shopreel/editor/post/${generationId}`;
}

function contentTypeForOutput(outputType: OutputType) {
  if (outputType === "blog") return "blog_post";
  if (outputType === "email") return "email";
  if (outputType === "post") return "social_post";
  return "video";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    if (!body.topic || body.topic.trim().length < 3) {
      return NextResponse.json({ ok: false, error: "Topic required" }, { status: 400 });
    }

    if (!body.outputType) {
      return NextResponse.json({ ok: false, error: "Output type required" }, { status: 400 });
    }

    if (!body.angle || !body.angle.title || !body.angle.hook) {
      return NextResponse.json({ ok: false, error: "Angle required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const bullets = safeStringArray(body.researchBullets).slice(0, 6);
    const title = `${body.topic.trim()} — ${body.angle.title}`;

    const source: StorySource = {
      id: `creator-output:${Date.now()}`,
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
      tags: ["creator_mode", "derived_output", body.outputType],
      notes: bullets.length > 0 ? bullets : [body.angle.angle, body.angle.whyItWorks],
      facts: {
        hook: body.angle.hook,
        contentType: contentTypeForOutput(body.outputType),
        expanded_topic: body.expandedTopic ?? body.topic,
        selected_angle_title: body.angle.title,
        output_type: body.outputType,
      },
      metadata: {
        creatorMode: true,
        creatorModeType: "derived_output",
        creatorRequestId: body.creatorRequestId ?? null,
        selectedAngle: body.angle,
        expandedTopic: body.expandedTopic ?? body.topic,
        outputType: body.outputType,
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
          score: 92,
          status: "ready",
          reason: `${body.outputType} output ready from creator angle`,
          metadata: {
            source_type: "creator_request",
            creator_request_id: body.creatorRequestId ?? null,
            creator_mode: "derived_output",
            creator_title: title,
            selected_angle: body.angle,
            expanded_topic: body.expandedTopic ?? body.topic,
            output_type: body.outputType,
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
        `This angle matters because it helps viewers understand ${body.expandedTopic ?? body.topic}.`,
      ctaLine: body.angle.suggestedCta || "Follow for more updates.",
      expandedTopic: body.expandedTopic ?? body.topic,
      mode: "research_script",
    });

    const contentPiece = await createContentPieceFromStoryDraft({
      shopId,
      draft,
      sourceSystem: "creator_mode",
    });

    await legacy
      .from("content_pieces")
      .update({
        metadata: {
          ...(contentPiece.metadata && typeof contentPiece.metadata === "object" ? contentPiece.metadata : {}),
          output_type: body.outputType,
          editor_type: body.outputType,
        },
        content_type:
          body.outputType === "blog"
            ? "blog_post"
            : body.outputType === "email"
              ? "email"
              : body.outputType === "post"
                ? "social_post"
                : contentPiece.content_type,
      })
      .eq("id", contentPiece.id);

    const generation = await saveStoryGeneration({
      shopId,
      storySourceId: savedSource.id,
      contentPieceId: contentPiece.id,
      draft,
      status: "draft",
      metadata: {
        creator_mode: true,
        creator_mode_type: "derived_output",
        creator_request_id: body.creatorRequestId ?? null,
        selected_angle: body.angle,
        expanded_topic: body.expandedTopic ?? body.topic,
        research_summary: body.researchSummary ?? body.angle.angle,
        research_bullets: bullets,
        output_type: body.outputType,
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
                outputType: body.outputType,
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
      editorUrl: routeForOutput(body.outputType, generation.id),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create output";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
