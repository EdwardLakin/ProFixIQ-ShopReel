import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeGenerationPublishReadiness } from "@/features/shopreel/operations/lib/publishReadiness";
import {
  ACTIVE_PUBLISH_JOB_STATUSES,
  ACTIVE_PUBLICATION_STATUSES,
  QUEUED_PUBLISH_JOB_STATUS,
  QUEUED_PUBLICATION_STATUS,
} from "@/features/shopreel/lib/contracts/lifecycle";
import {
  requireUserActionTenantContext,
  toEndpointErrorResponse,
} from "@/features/shopreel/server/endpointPolicy";

type PublishPlatform = "instagram" | "facebook" | "tiktok" | "youtube";

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function isPlatform(value: unknown): value is PublishPlatform {
  return (
    value === "instagram" ||
    value === "facebook" ||
    value === "tiktok" ||
    value === "youtube"
  );
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { platform?: unknown };
    const platform = body.platform;

    if (!isPlatform(platform)) {
      return NextResponse.json(
        { ok: false, error: "Invalid platform" },
        { status: 400 }
      );
    }

    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();
    const legacy = supabase as any;

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
        { ok: false, error: "Generation not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const [{ data: contentPiece }, { data: renderJob }, { data: generationPublications }, { data: connectedAccounts }] = await Promise.all([
      generation.content_piece_id
        ? legacy.from("content_pieces").select("id, render_url").eq("id", generation.content_piece_id).maybeSingle()
        : Promise.resolve({ data: null }),
      generation.render_job_id
        ? legacy.from("reel_render_jobs").select("status, error_message").eq("id", generation.render_job_id).maybeSingle()
        : Promise.resolve({ data: null }),
      generation.content_piece_id
        ? legacy.from("content_publications").select("status, scheduled_for").eq("content_piece_id", generation.content_piece_id)
        : Promise.resolve({ data: [] }),
      legacy
        .from("content_platform_accounts")
        .select("id")
        .eq("tenant_shop_id", shopId)
        .eq("connection_active", true)
        .limit(1),
    ]);

    const readiness = computeGenerationPublishReadiness({
      generation,
      renderJob: renderJob ?? null,
      contentPiece: contentPiece ?? null,
      publications: (generationPublications ?? []) as Array<{ status: string; scheduled_for: string | null }>,
      hasConnectedPlatformAccount: (connectedAccounts?.length ?? 0) > 0,
    });

    if (readiness.state !== "ready_to_publish") {
      return NextResponse.json(
        { ok: false, error: `Generation is not publish-ready: ${readiness.label}` },
        { status: 400 }
      );
    }

    if (!generation.content_piece_id) {
      return NextResponse.json(
        { ok: false, error: "Generation is missing a content piece" },
        { status: 400 }
      );
    }

    const storyDraft = objectRecord(generation.story_draft);
    const metadata = objectRecord(generation.generation_metadata);

    const title =
      typeof storyDraft.title === "string" && storyDraft.title.trim().length > 0
        ? storyDraft.title
        : "Untitled generation";

    const { data: existingRows, error: existingError } = await legacy
      .from("content_publications")
      .select("*")
      .eq("content_piece_id", generation.content_piece_id)
      .eq("platform", platform)
      .in("status", ACTIVE_PUBLICATION_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingError) {
      throw new Error(existingError.message);
    }

    const existingPublication = existingRows?.[0] ?? null;

    if (existingPublication) {
      const { data: existingJobs, error: existingJobsError } = await legacy
        .from("shopreel_publish_jobs")
        .select("*")
        .eq("publication_id", existingPublication.id)
        .in("status", ACTIVE_PUBLISH_JOB_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingJobsError) {
        throw new Error(existingJobsError.message);
      }

      const existingJob = existingJobs?.[0] ?? null;

      if (existingJob) {
        return NextResponse.json({
          ok: true,
          alreadyQueued: true,
          repairedJob: false,
          publicationId: existingPublication.id,
          publishJobId: existingJob.id,
        });
      }

      const { data: repairedJob, error: repairedJobError } = await legacy
        .from("shopreel_publish_jobs")
        .insert({
          shop_id: shopId,
          publication_id: existingPublication.id,
          status: QUEUED_PUBLISH_JOB_STATUS,
          attempt_count: 0,
          error_message: null,
          run_after: now,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();

      if (repairedJobError) {
        throw new Error(repairedJobError.message);
      }

      await legacy
        .from("content_publications")
        .update({
          status: QUEUED_PUBLICATION_STATUS,
          error_text: null,
          updated_at: now,
        })
        .eq("id", existingPublication.id);

      return NextResponse.json({
        ok: true,
        alreadyQueued: false,
        repairedJob: true,
        publicationId: existingPublication.id,
        publishJobId: repairedJob.id,
      });
    }

    const { data: publication, error: publicationError } = await legacy
      .from("content_publications")
      .insert({
        content_piece_id: generation.content_piece_id,
        platform,
        status: QUEUED_PUBLICATION_STATUS,
        scheduled_for: null,
        published_at: null,
        platform_post_url: null,
        platform_post_id: null,
        platform_account_id: null,
        error_text: null,
        tenant_shop_id: shopId,
        source_shop_id: shopId,
        source_system: "shopreel",
        metadata: {
          title,
          generation_id: generation.id,
          output_type:
            typeof metadata.output_type === "string" ? metadata.output_type : "video",
        },
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (publicationError) {
      throw new Error(publicationError.message);
    }

    const { data: publishJob, error: publishJobError } = await legacy
      .from("shopreel_publish_jobs")
      .insert({
        shop_id: shopId,
        publication_id: publication.id,
        status: QUEUED_PUBLISH_JOB_STATUS,
        attempt_count: 0,
        error_message: null,
        run_after: now,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (publishJobError) {
      throw new Error(publishJobError.message);
    }

    return NextResponse.json({
      ok: true,
      publicationId: publication.id,
      publishJobId: publishJob.id,
      alreadyQueued: false,
      repairedJob: false,
    });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to queue publish job");
  }
}
