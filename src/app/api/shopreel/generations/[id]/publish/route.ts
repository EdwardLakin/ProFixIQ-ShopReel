import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

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

    const shopId = await getCurrentShopId();
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

    if (generation.status !== "ready") {
      return NextResponse.json(
        { ok: false, error: "Generation must be ready before publishing" },
        { status: 400 }
      );
    }

    if (!generation.content_piece_id) {
      return NextResponse.json(
        { ok: false, error: "Generation is missing a content piece" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
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
      .in("status", ["queued", "publishing", "failed"])
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
        .in("status", ["queued", "processing"])
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
          status: "queued",
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
          status: "queued",
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
        status: "queued",
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
        status: "queued",
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
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to queue publish job",
      },
      { status: 500 }
    );
  }
}
