import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createPublication } from "@/features/shopreel/publishing/lib/createPublication";
import { enqueuePublishJob } from "@/features/shopreel/publishing/lib/enqueuePublishJob";
import type { PublishPlatform, PublishMode } from "@/features/shopreel/publishing/types";
import { computeGenerationPublishReadiness } from "@/features/shopreel/operations/lib/publishReadiness";
import {
  requireUserActionTenantContext,
} from "@/features/shopreel/server/endpointPolicy";

type Body = {
  platform?: PublishPlatform;
  publishMode?: PublishMode | null;
  runAfter?: string | null;
};

function toObjectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Body;

    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const platform: PublishPlatform = body.platform ?? "instagram";
    const publishMode: PublishMode | null = body.publishMode ?? "manual";

    const { data: generation, error: generationError } = await legacy
      .from("shopreel_story_generations")
      .select("*")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (generationError) {
      throw new Error(generationError.message);
    }

    if (!generation) {
      return NextResponse.json(
        { ok: false, error: "Story generation not found" },
        { status: 404 },
      );
    }

    if (!generation.content_piece_id) {
      return NextResponse.json(
        { ok: false, error: "Generation has no content piece" },
        { status: 400 },
      );
    }

    const [{ data: contentPiece, error: contentPieceError }, { data: renderJob }, { data: generationPublications }, { data: connectedAccounts }] = await Promise.all([
      legacy
        .from("content_pieces")
        .select("*")
        .eq("id", generation.content_piece_id)
        .maybeSingle(),
      generation.render_job_id
        ? legacy.from("reel_render_jobs").select("status, error_message").eq("id", generation.render_job_id).maybeSingle()
        : Promise.resolve({ data: null }),
      legacy.from("content_publications").select("status, scheduled_for").eq("content_piece_id", generation.content_piece_id),
      legacy
        .from("content_platform_accounts")
        .select("id")
        .eq("tenant_shop_id", shopId)
        .eq("connection_active", true)
        .limit(1),
    ]);

    if (contentPieceError) {
      throw new Error(contentPieceError.message);
    }

    if (!contentPiece) {
      return NextResponse.json(
        { ok: false, error: "Content piece not found" },
        { status: 404 },
      );
    }


    const readiness = computeGenerationPublishReadiness({
      generation,
      renderJob: renderJob ?? null,
      contentPiece: contentPiece ?? null,
      publications: (generationPublications ?? []) as Array<{ status: string; scheduled_for: string | null }>,
      hasConnectedPlatformAccount: (connectedAccounts?.length ?? 0) > 0,
    });

    if (readiness.state !== "ready_to_publish") {
      return NextResponse.json(
        { ok: false, error: `Story generation is not publish-ready: ${readiness.label}` },
        { status: 400 },
      );
    }
    if (!contentPiece.render_url) {
      return NextResponse.json(
        { ok: false, error: "Content piece has no render_url" },
        { status: 400 },
      );
    }

    const { data: storySource, error: storySourceError } = await legacy
      .from("shopreel_story_sources")
      .select("*")
      .eq("id", generation.story_source_id)
      .maybeSingle();

    if (storySourceError) {
      throw new Error(storySourceError.message);
    }

    const generationMetadata = toObjectRecord(generation.generation_metadata ?? {});

    const publication = await createPublication({
      shopId,
      contentPieceId: generation.content_piece_id,
      platform,
      publishMode,
      scheduledFor: body.runAfter ?? null,
      title: contentPiece.title ?? generation.story_draft?.title ?? null,
      caption: contentPiece.caption ?? generation.story_draft?.caption ?? null,
      storySourceId: generation.story_source_id,
      storySourceKind: storySource?.kind ?? null,
    });

    const publishJob = await enqueuePublishJob({
      shopId,
      publicationId: publication.id,
      runAfter: body.runAfter ?? null,
    });

    await legacy
      .from("shopreel_story_generations")
      .update({
        generation_metadata: {
          ...generationMetadata,
          publication_id: publication.id,
          publish_job_id: publishJob.id,
          publish_platform: platform,
          queued_for_publish_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", generation.id);

    return NextResponse.json({
      ok: true,
      publicationId: publication.id,
      publishJobId: publishJob.id,
      platform,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to enqueue publication";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
