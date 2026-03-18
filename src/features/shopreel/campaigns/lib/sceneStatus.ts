import { createAdminClient } from "@/lib/supabase/server";

export async function refreshCampaignItemSceneStatuses(campaignItemId: string) {
  const supabase = createAdminClient();

  const { data: scenes, error } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select(`
      id,
      media_job_id,
      media_job:shopreel_media_generation_jobs (
        id,
        status,
        output_asset_id
      )
    `)
    .eq("campaign_item_id", campaignItemId)
    .order("scene_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  for (const scene of scenes ?? []) {
    const mediaJob = Array.isArray(scene.media_job) ? scene.media_job[0] ?? null : scene.media_job;
    if (!mediaJob?.id) continue;

    const nextStatus =
      mediaJob.status === "completed" && mediaJob.output_asset_id
        ? "completed"
        : mediaJob.status;

    const payload: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (mediaJob.output_asset_id) {
      payload.output_asset_id = mediaJob.output_asset_id;
    }

    const { error: updateError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .update(payload)
      .eq("id", scene.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}
