import path from "node:path";
import os from "node:os";
import { createAdminClient } from "@/lib/supabase/server";
import { assemblePremiumCampaignItem } from "@/features/shopreel/campaigns/lib/premiumAssembly";

export async function processPremiumCampaignItem(itemId: string) {
  const supabase = createAdminClient();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select(`
      *,
      campaign:shopreel_campaigns(*)
    `)
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs(*)
    `)
    .eq("campaign_item_id", itemId)
    .order("scene_order", { ascending: true });

  if (scenesError) throw scenesError;

  const completedScenes = (scenes ?? []).filter((scene) => {
    const mediaJob = Array.isArray(scene.media_job) ? scene.media_job[0] : scene.media_job;
    return mediaJob?.status === "completed" && mediaJob?.preview_url;
  });

  if (completedScenes.length === 0) {
    throw new Error("No completed scene videos available for assembly");
  }

  const workDir = path.join(os.tmpdir(), "shopreel-premium", itemId);

  const result = await assemblePremiumCampaignItem({
    workDir,
    campaignTitle: item.campaign?.title ?? item.title,
    angle: item.angle,
    audience: item.campaign?.audience ?? null,
    offer: item.campaign?.offer ?? null,
    goal: item.campaign?.campaign_goal ?? null,
    scenes: completedScenes.map((scene) => {
      const mediaJob = Array.isArray(scene.media_job) ? scene.media_job[0] : scene.media_job;
      return {
        title: scene.title,
        prompt: scene.prompt,
        localVideoPath: mediaJob.preview_url as string,
      };
    }),
    outputBaseName: itemId,
  });

  return result;
}
