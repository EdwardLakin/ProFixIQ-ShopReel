import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { processMediaGenerationJob } from "@/features/shopreel/video-creation/lib/server";

type SceneRow = {
  id: string;
  media_job_id: string | null;
  output_asset_id: string | null;
  status: string | null;
  media_job:
    | {
        id: string;
        status: string | null;
        provider: string | null;
        provider_job_id: string | null;
        preview_url: string | null;
        output_asset_id: string | null;
        settings: unknown;
      }
    | Array<{
        id: string;
        status: string | null;
        provider: string | null;
        provider_job_id: string | null;
        preview_url: string | null;
        output_asset_id: string | null;
        settings: unknown;
      }>
    | null;
};

function normalizeRelatedRow<T>(row: T | T[] | null | undefined): T | null {
  return Array.isArray(row) ? row[0] ?? null : row ?? null;
}

function isActiveStatus(status: string | null | undefined) {
  return /queued|submitted|processing|rendering|running|pending/i.test(status ?? "");
}

function isCompletedJob(job: { status: string | null; preview_url: string | null; output_asset_id: string | null } | null) {
  return job?.status === "completed" && Boolean(job.preview_url || job.output_asset_id);
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: item, error: itemError } = await supabase
      .from("shopreel_campaign_items")
      .select("id, campaign_id, shop_id")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    const { data: scenes, error: scenesError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select(`
        id,
        media_job_id,
        output_asset_id,
        status,
        media_job:shopreel_media_generation_jobs (
          id,
          status,
          provider,
          provider_job_id,
          preview_url,
          output_asset_id,
          settings
        )
      `)
      .eq("campaign_item_id", id)
      .eq("shop_id", shopId)
      .order("scene_order", { ascending: true });

    if (scenesError) {
      throw new Error(scenesError.message);
    }

    const sceneIds = (scenes ?? []).map((scene) => scene.id);

    const { data: frameJobs, error: frameError } = sceneIds.length
      ? await supabase
          .from("shopreel_media_generation_jobs")
          .select("id, preview_url, output_asset_id, settings, status")
          .eq("shop_id", shopId)
          .eq("job_type", "image")
          .in("status", ["completed"])
          .not("preview_url", "is", null)
      : { data: [], error: null };

    if (frameError) {
      throw new Error(frameError.message);
    }

    const frameBySceneId = new Map<
      string,
      { id: string; preview_url: string | null; output_asset_id: string | null }
    >();

    for (const frame of frameJobs ?? []) {
      const settings =
        frame.settings && typeof frame.settings === "object" && !Array.isArray(frame.settings)
          ? (frame.settings as Record<string, unknown>)
          : {};
      const sceneId = typeof settings.scene_id === "string" ? settings.scene_id : null;
      if (!sceneId || frameBySceneId.has(sceneId)) continue;
      frameBySceneId.set(sceneId, {
        id: frame.id,
        preview_url: frame.preview_url,
        output_asset_id: frame.output_asset_id,
      });
    }

    const results: Array<{
      sceneId: string;
      mediaJobId: string | null;
      providerJobId?: string | null;
      status: string;
      skipped?: boolean;
      reason?: string;
    }> = [];

    for (const scene of (scenes ?? []) as SceneRow[]) {
      const mediaJob = normalizeRelatedRow(scene.media_job);

      if (!scene.media_job_id || !mediaJob) {
        results.push({
          sceneId: scene.id,
          mediaJobId: null,
          status: "skipped",
          skipped: true,
          reason: "missing_media_job",
        });
        continue;
      }

      if (isCompletedJob(mediaJob) || scene.output_asset_id) {
        results.push({
          sceneId: scene.id,
          mediaJobId: scene.media_job_id,
          providerJobId: mediaJob.provider_job_id,
          status: mediaJob.status ?? "completed",
          skipped: true,
          reason: "already_completed",
        });
        continue;
      }

      const frame = frameBySceneId.get(scene.id);
      if (!frame?.preview_url) {
        results.push({
          sceneId: scene.id,
          mediaJobId: scene.media_job_id,
          status: mediaJob.status ?? "skipped",
          skipped: true,
          reason: "missing_reference_frame",
        });
        continue;
      }

      if (
        mediaJob.provider === "fal" &&
        isActiveStatus(mediaJob.status) &&
        mediaJob.provider_job_id
      ) {
        results.push({
          sceneId: scene.id,
          mediaJobId: scene.media_job_id,
          providerJobId: mediaJob.provider_job_id,
          status: mediaJob.status ?? "active",
          skipped: true,
          reason: "already_active",
        });
        continue;
      }

      const existingSettings =
        mediaJob.settings && typeof mediaJob.settings === "object" && !Array.isArray(mediaJob.settings)
          ? (mediaJob.settings as Record<string, unknown>)
          : {};

      const nextSettings = {
        ...existingSettings,
        start_image_url: frame.preview_url,
        start_image_job_id: frame.id,
        start_image_asset_id: frame.output_asset_id ?? null,
      };

      const { error: prepError } = await supabase
        .from("shopreel_media_generation_jobs")
        .update({
          provider: "fal",
          status: "queued",
          provider_job_id: null,
          preview_url: null,
          error_text: null,
          completed_at: null,
          settings: nextSettings,
          input_asset_ids: frame.output_asset_id ? [frame.output_asset_id] : [],
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", scene.media_job_id)
        .eq("shop_id", shopId);

      if (prepError) {
        throw new Error(prepError.message);
      }

      const job = await processMediaGenerationJob(scene.media_job_id, { shopId });

      results.push({
        sceneId: scene.id,
        mediaJobId: job.id,
        providerJobId: job.provider_job_id,
        status: job.status,
      });
    }

    revalidatePath(`/shopreel/campaigns/${item.campaign_id}`);
    revalidatePath(`/shopreel/campaigns/items/${item.id}`);

    return NextResponse.json({
      ok: true,
      count: results.filter((result) => !result.skipped).length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run scene jobs",
      },
      { status: 500 }
    );
  }
}
