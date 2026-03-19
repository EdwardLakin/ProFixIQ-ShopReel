import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type PlannedScene = {
  sceneOrder: number;
  title: string;
  prompt: string;
  durationSeconds: number;
};

export function planScenesForCampaignItem(args: {
  itemTitle: string;
  angle: string;
  prompt: string;
}) : PlannedScene[] {
  const base = args.prompt.trim();

  return [
    {
      sceneOrder: 1,
      title: `${args.itemTitle} — Hook`,
      prompt: `${base} Scene objective: create a powerful opening hook in the first seconds. Make it highly visual, attention-grabbing, and premium.`,
      durationSeconds: 4,
    },
    {
      sceneOrder: 2,
      title: `${args.itemTitle} — Problem`,
      prompt: `${base} Scene objective: show the old way, pain point, confusion, or frustration clearly and visually.`,
      durationSeconds: 4,
    },
    {
      sceneOrder: 3,
      title: `${args.itemTitle} — Solution`,
      prompt: `${base} Scene objective: show the better way, transformation, modern workflow, or system improvement.`,
      durationSeconds: 4,
    },
    {
      sceneOrder: 4,
      title: `${args.itemTitle} — Outcome`,
      prompt: `${base} Scene objective: show the payoff, outcome, confidence, growth, or polished end result.`,
      durationSeconds: 4,
    },
  ];
}

export async function ensureScenesForCampaignItem(campaignItemId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("id", campaignItemId)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const { data: existingScenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select("*")
    .eq("campaign_item_id", campaignItemId)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  if ((existingScenes ?? []).length > 0) {
    return existingScenes;
  }

  const plannedScenes = planScenesForCampaignItem({
    itemTitle: item.title,
    angle: item.angle,
    prompt: item.prompt,
  });

  const { data: insertedScenes, error: insertError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .insert(
      plannedScenes.map((scene) => ({
        campaign_item_id: item.id,
        campaign_id: item.campaign_id,
        shop_id: item.shop_id,
        scene_order: scene.sceneOrder,
        title: scene.title,
        prompt: scene.prompt,
        duration_seconds: scene.durationSeconds,
        status: "draft",
      }))
    )
    .select("*");

  if (insertError) {
    throw new Error(insertError.message);
  }

  return insertedScenes ?? [];
}

export async function createMediaJobsForCampaignItemScenes(campaignItemId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("id", campaignItemId)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const scenes = await ensureScenesForCampaignItem(campaignItemId);

  const createdJobIds: string[] = [];

  for (const scene of scenes) {
    if (scene.media_job_id) continue;

    const { data: mediaJob, error: mediaJobError } = await supabase
      .from("shopreel_media_generation_jobs")
      .insert({
        shop_id: shopId,
        created_by: null,
        source_content_piece_id: item.content_piece_id,
        provider: "openai",
        job_type: "video",
        status: "queued",
        prompt: scene.prompt,
        prompt_enhanced: scene.prompt,
        negative_prompt: item.negative_prompt,
        title: scene.title,
        style: item.style,
        visual_mode: item.visual_mode,
        aspect_ratio: item.aspect_ratio,
        duration_seconds: 4,
        input_asset_ids: [],
        settings: {
          campaign_item_id: item.id,
          campaign_id: item.campaign_id,
          scene_id: scene.id,
          scene_order: scene.scene_order,
          assembly_mode: "multi_scene",
        },
      })
      .select("*")
      .single();

    if (mediaJobError || !mediaJob) {
      throw new Error(mediaJobError?.message ?? "Failed to create scene media job");
    }

    const { error: updateSceneError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .update({
        media_job_id: mediaJob.id,
        status: "queued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", scene.id);

    if (updateSceneError) {
      throw new Error(updateSceneError.message);
    }

    createdJobIds.push(mediaJob.id);
  }

  return createdJobIds;
}
