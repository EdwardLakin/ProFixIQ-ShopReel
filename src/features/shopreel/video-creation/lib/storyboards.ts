import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Database, Json } from "@/types/supabase";

type StoryboardInsert =
  Database["public"]["Tables"]["shopreel_storyboards"]["Insert"];

type StoryboardSceneInsert =
  Database["public"]["Tables"]["shopreel_storyboard_scenes"]["Insert"];

type MediaJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

export async function createStoryboard(args: {
  title: string;
  prompt: string;
  style: string | null;
  visualMode: string | null;
  aspectRatio: string;
  scenes: Array<{
    title: string;
    prompt: string;
    durationSeconds: number | null;
    sortOrder: number;
  }>;
  metadata?: Json;
}) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const storyboardInsert: StoryboardInsert = {
    shop_id: shopId,
    title: args.title,
    prompt: args.prompt,
    style: args.style,
    visual_mode: args.visualMode,
    aspect_ratio: args.aspectRatio,
    metadata: args.metadata ?? {},
  };

  const { data: storyboard, error: storyboardError } = await supabase
    .from("shopreel_storyboards")
    .insert(storyboardInsert)
    .select("*")
    .single();

  if (storyboardError || !storyboard?.id) {
    throw new Error(storyboardError?.message ?? "Failed to create storyboard");
  }

  if (args.scenes.length > 0) {
    const sceneInserts: StoryboardSceneInsert[] = args.scenes.map((scene) => ({
      storyboard_id: storyboard.id,
      shop_id: shopId,
      title: scene.title,
      prompt: scene.prompt,
      duration_seconds: scene.durationSeconds,
      sort_order: scene.sortOrder,
      metadata: {},
    }));

    const { error: scenesError } = await supabase
      .from("shopreel_storyboard_scenes")
      .insert(sceneInserts);

    if (scenesError) {
      throw new Error(scenesError.message);
    }
  }

  return storyboard.id;
}

export async function createStoryboardFromMediaJob(args: {
  mediaJob: MediaJobRow;
  sceneCount?: number;
}) {
  const mediaJob = args.mediaJob;
  const sceneCount = args.sceneCount ?? 5;

  const baseTitle = mediaJob.title?.trim() || "Generated storyboard";
  const basePrompt =
    mediaJob.prompt_enhanced?.trim() ||
    mediaJob.prompt?.trim() ||
    "Create a premium storyboard from the source media job.";

  const scenes = Array.from({ length: sceneCount }).map((_, index) => ({
    title: `Scene ${index + 1}`,
    prompt: `${basePrompt} Scene ${index + 1} with clear visual intent, premium composition, and continuity.`,
    durationSeconds: mediaJob.job_type === "image" ? null : 3,
    sortOrder: index,
  }));

  return createStoryboard({
    title: `${baseTitle} Storyboard`,
    prompt: basePrompt,
    style: mediaJob.style,
    visualMode: mediaJob.visual_mode,
    aspectRatio: mediaJob.aspect_ratio,
    scenes,
    metadata: {
      source_media_generation_job_id: mediaJob.id,
    },
  });
}

export async function listRecentStoryboards(limit = 12) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_storyboards")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listThumbnailReadyMediaJobs(limit = 24) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "completed")
    .not("output_asset_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createThumbnailJobFromMediaJob(args: {
  mediaJobId: string;
  title: string;
}) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: mediaJob, error: mediaJobError } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("id", args.mediaJobId)
    .eq("shop_id", shopId)
    .single();

  if (mediaJobError || !mediaJob) {
    throw new Error(mediaJobError?.message ?? "Media job not found");
  }

  const { data: thumbnailJob, error: thumbnailJobError } = await supabase
    .from("shopreel_media_generation_jobs")
    .insert({
      shop_id: shopId,
      provider: "openai",
      job_type: "image",
      status: "queued",
      title: args.title,
      prompt:
        mediaJob.prompt_enhanced ??
        mediaJob.prompt ??
        "Create a premium thumbnail derived from the source media.",
      negative_prompt: "Avoid blur, unreadable text, duplicated objects, low detail.",
      style: mediaJob.style,
      visual_mode: mediaJob.visual_mode,
      aspect_ratio: "16:9",
      duration_seconds: null,
      input_asset_ids: mediaJob.output_asset_id ? [mediaJob.output_asset_id] : [],
      settings: {
        thumbnail_source_media_job_id: mediaJob.id,
      } satisfies Json,
      result_payload: {},
    })
    .select("*")
    .single();

  if (thumbnailJobError || !thumbnailJob) {
    throw new Error(thumbnailJobError?.message ?? "Failed to create thumbnail job");
  }

  return thumbnailJob.id;
}
