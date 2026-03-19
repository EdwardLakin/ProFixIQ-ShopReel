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
}): PlannedScene[] {
  const base = args.prompt.trim();

  return [
    {
      sceneOrder: 1,
      title: `${args.itemTitle} — Hook`,
      prompt: `${base} Scene objective: create a powerful opening hook in the first seconds. Make it highly visual, attention-grabbing, and premium.`,
      durationSeconds: 8,
    },
    {
      sceneOrder: 2,
      title: `${args.itemTitle} — Problem`,
      prompt: `${base} Scene objective: show the old way, pain point, confusion, or frustration clearly and visually.`,
      durationSeconds: 8,
    },
    {
      sceneOrder: 3,
      title: `${args.itemTitle} — Solution`,
      prompt: `${base} Scene objective: show the better way, transformation, modern workflow, or system improvement.`,
      durationSeconds: 8,
    },
    {
      sceneOrder: 4,
      title: `${args.itemTitle} — Outcome`,
      prompt: `${base} Scene objective: show the payoff, outcome, confidence, growth, or polished end result.`,
      durationSeconds: 8,
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

  const plannedScenes = planScenesForCampaignItem({
    itemTitle: item.title,
    angle: item.angle,
    prompt: item.prompt,
  });

  const { data: existingScenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select("*")
    .eq("campaign_item_id", campaignItemId)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  if ((existingScenes ?? []).length === 0) {
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

  for (const planned of plannedScenes) {
    const existing = (existingScenes ?? []).find(
      (scene) => scene.scene_order === planned.sceneOrder
    );

    if (!existing) {
      const { error: insertMissingError } = await supabase
        .from("shopreel_campaign_item_scenes")
        .insert({
          campaign_item_id: item.id,
          campaign_id: item.campaign_id,
          shop_id: item.shop_id,
          scene_order: planned.sceneOrder,
          title: planned.title,
          prompt: planned.prompt,
          duration_seconds: planned.durationSeconds,
          status: "draft",
        });

      if (insertMissingError) {
        throw new Error(insertMissingError.message);
      }

      continue;
    }

    const { error: repairError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .update({
        title: planned.title,
        prompt: planned.prompt,
        duration_seconds: planned.durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (repairError) {
      throw new Error(repairError.message);
    }
  }

  const { data: refreshedScenes, error: refreshError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select("*")
    .eq("campaign_item_id", campaignItemId)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (refreshError) {
    throw new Error(refreshError.message);
  }

  return refreshedScenes ?? [];
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
    if (scene.media_job_id) {
      await supabase
        .from("shopreel_campaign_item_scenes")
        .update({
          media_job_id: null,
          status: "draft",
          output_asset_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scene.id);

      const { data: existingJobs } = await supabase
        .from("shopreel_media_generation_jobs")
        .select("id, settings")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      const staleJobIds =
        (existingJobs ?? [])
          .filter((job) => {
            const settings =
              job.settings &&
              typeof job.settings === "object" &&
              !Array.isArray(job.settings)
                ? (job.settings as Record<string, unknown>)
                : null;

            return (
              settings?.campaign_item_id === item.id &&
              settings?.scene_id === scene.id
            );
          })
          .map((job) => job.id);

      if (staleJobIds.length > 0) {
        await supabase
          .from("shopreel_media_generation_jobs")
          .delete()
          .in("id", staleJobIds)
          .eq("shop_id", shopId);
      }
    }

    const { data: mediaJob, error: mediaJobError } = await supabase
      .from("shopreel_media_generation_jobs")
      .insert({
        shop_id: shopId,
        created_by: null,
        source_content_piece_id: item.content_piece_id,
        provider: "runway",
        job_type: "video",
        status: "queued",
        prompt: scene.prompt,
        prompt_enhanced: scene.prompt,
        negative_prompt: item.negative_prompt,
        title: scene.title,
        style: item.style,
        visual_mode: item.visual_mode,
        aspect_ratio: item.aspect_ratio,
        duration_seconds: scene.duration_seconds ?? 8,
        input_asset_ids: [],
        settings: {
          campaign_item_id: item.id,
          campaign_id: item.campaign_id,
          scene_id: scene.id,
          scene_order: scene.scene_order,
          assembly_mode: "multi_scene",
          pipeline: "premium_runway_scene",
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
