import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { createAdminClient } from "@/lib/supabase/server";
import { assemblePremiumCampaignItem } from "@/features/shopreel/campaigns/lib/premiumAssembly";
import { uploadLocalFileToGeneratedMedia } from "@/features/shopreel/video-creation/lib/assets";

async function downloadToLocalFile(url: string, outputPath: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download scene clip: ${res.status}`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, bytes);
}

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

  const campaign = Array.isArray(item.campaign) ? item.campaign[0] : item.campaign;

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs(*)
    `)
    .eq("campaign_item_id", itemId)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  const completedScenes = (scenes ?? [])
    .map((scene) => {
      const mediaJob = Array.isArray(scene.media_job) ? scene.media_job[0] : scene.media_job;
      return {
        scene,
        mediaJob,
      };
    })
    .filter(({ mediaJob }) => mediaJob?.status === "completed" && mediaJob?.preview_url);

  if (completedScenes.length === 0) {
    throw new Error("No completed scene videos available for premium assembly");
  }

  const workDir = path.join(os.tmpdir(), "shopreel-premium", itemId);
  await fs.mkdir(workDir, { recursive: true });

  const localScenes = [];
  for (const { scene, mediaJob } of completedScenes) {
    const localVideoPath = path.join(
      workDir,
      `scene-${scene.scene_order}.mp4`
    );

    await downloadToLocalFile(mediaJob.preview_url as string, localVideoPath);

    localScenes.push({
      title: scene.title,
      prompt: scene.prompt,
      localVideoPath,
    });
  }

  const assembled = await assemblePremiumCampaignItem({
    workDir,
    campaignTitle: campaign?.title ?? item.title,
    angle: item.angle,
    audience: campaign?.audience ?? null,
    offer: campaign?.offer ?? null,
    goal: campaign?.campaign_goal ?? null,
    scenes: localScenes,
    outputBaseName: itemId,
  });

  const finalAsset = await uploadLocalFileToGeneratedMedia({
    shopId: item.shop_id,
    localFilePath: assembled.finalVideo,
    fileName: `${itemId}-premium-final.mp4`,
    title: `${item.title} — Premium Final`,
    mimeType: "video/mp4",
  });

  const { error: updateItemError } = await supabase
    .from("shopreel_campaign_items")
    .update({
      final_output_asset_id: finalAsset.id,
      status: "completed",
      updated_at: new Date().toISOString(),
      metadata: {
        ...(item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
          ? item.metadata
          : {}),
        premium_pipeline: true,
        premium_voiceover_script: assembled.script,
        premium_final_asset_id: finalAsset.id,
      },
    })
    .eq("id", item.id);

  if (updateItemError) {
    throw new Error(updateItemError.message);
  }

  return {
    itemId: item.id,
    finalAssetId: finalAsset.id,
    finalAssetUrl: finalAsset.public_url,
    voiceoverScript: assembled.script,
  };
}
