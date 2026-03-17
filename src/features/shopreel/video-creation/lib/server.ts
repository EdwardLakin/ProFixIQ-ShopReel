import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Database, Json } from "@/types/supabase";
import {
  buildEnhancedPrompt,
  type VideoCreationFormInput,
} from "./types";
import { getMediaProviderAdapter } from "../providers";
import { ensureContentPieceForMediaJob } from "./contentPieces";
import {
  enhancePromptWithBrandVoice,
  createThumbnailAssetForMediaJob,
} from "./enhancement";
import { createStoryboardFromMediaJob } from "./storyboards";

type MediaGenerationJobInsert =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Insert"];

type MediaGenerationJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

type ContentAssetInsert =
  Database["public"]["Tables"]["content_assets"]["Insert"];

export async function createMediaGenerationJob(
  input: VideoCreationFormInput
): Promise<MediaGenerationJobRow> {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const enhancedPrompt = await enhancePromptWithBrandVoice({
    prompt: input.prompt || null,
    style: input.style,
    visualMode: input.visualMode,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.jobType === "image" ? null : input.durationSeconds,
  });

  const insertPayload: MediaGenerationJobInsert = {
    shop_id: shopId,
    provider: input.jobType === "asset_assembly" ? "assembly" : input.provider,
    job_type: input.jobType,
    status: "queued",
    title: input.title || null,
    prompt: input.prompt || null,
    prompt_enhanced: enhancedPrompt || buildEnhancedPrompt(input),
    negative_prompt: input.negativePrompt || null,
    style: input.style,
    visual_mode: input.visualMode,
    aspect_ratio: input.aspectRatio,
    duration_seconds: input.durationSeconds,
    input_asset_ids: input.inputAssetIds,
    settings: {
      requested_provider: input.provider,
      requested_job_type: input.jobType,
      title: input.title,
    },
    result_payload: {},
  };

  const { data, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create media generation job");
  }

  return data;
}

async function createPlaceholderAsset(args: {
  shopId: string;
  title: string | null;
  assetType: "photo" | "video";
  metadata: Json;
}): Promise<string> {
  const supabase = createAdminClient();

  const insertPayload: ContentAssetInsert = {
    tenant_shop_id: args.shopId,
    source_shop_id: args.shopId,
    source_system: "shopreel",
    asset_type: args.assetType,
    title: args.title,
    metadata: args.metadata,
    public_url: null,
    storage_path: null,
    bucket: null,
    mime_type: null,
    caption: null,
  };

  const { data, error } = await supabase
    .from("content_assets")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to create output asset");
  }

  return data.id;
}

export async function processMediaGenerationJob(
  jobId: string
): Promise<MediaGenerationJobRow> {
  const supabase = createAdminClient();

  const { data: job, error: jobError } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    throw new Error(jobError?.message ?? "Media generation job not found");
  }

  await supabase
    .from("shopreel_media_generation_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  try {
    const provider = getMediaProviderAdapter(job.provider);

    const providerResult = await provider.run({
      jobId: job.id,
      provider: job.provider,
      jobType: job.job_type,
      prompt: job.prompt,
      promptEnhanced: job.prompt_enhanced,
      negativePrompt: job.negative_prompt,
      style: job.style,
      visualMode: job.visual_mode,
      aspectRatio: job.aspect_ratio,
      durationSeconds: job.duration_seconds,
      inputAssetIds: job.input_asset_ids ?? [],
      settings: job.settings,
    });

    const outputAssetId = await createPlaceholderAsset({
      shopId: job.shop_id,
      title: job.title,
      assetType: job.job_type === "image" ? "photo" : "video",
      metadata: {
        generated_by: "shopreel_video_creation",
        provider: job.provider,
        provider_job_id: providerResult.providerJobId,
        job_type: job.job_type,
        prompt: job.prompt,
        prompt_enhanced: job.prompt_enhanced,
        style: job.style,
        visual_mode: job.visual_mode,
        aspect_ratio: job.aspect_ratio,
        duration_seconds: job.duration_seconds,
        note: "Placeholder generated asset. Provider execution hook not fully wired yet.",
        provider_result: providerResult.resultPayload,
      } satisfies Json,
    });

    const { data: completed, error: completeError } = await supabase
      .from("shopreel_media_generation_jobs")
      .update({
        status: "completed",
        provider_job_id: providerResult.providerJobId,
        preview_url: providerResult.previewUrl,
        output_asset_id: outputAssetId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        result_payload: {
          output_asset_id: outputAssetId,
          provider: job.provider,
          provider_job_id: providerResult.providerJobId,
          preview_url: providerResult.previewUrl,
          provider_result: providerResult.resultPayload,
          completed_placeholder: true,
        },
      })
      .eq("id", jobId)
      .select("*")
      .single();

    if (completeError || !completed) {
      throw new Error(completeError?.message ?? "Failed to complete generation job");
    }

    await ensureContentPieceForMediaJob(completed);
    await createStoryboardFromMediaJob({ mediaJob: completed });
    await createThumbnailAssetForMediaJob({ mediaJob: completed });

    const { data: refreshedCompleted, error: refreshedCompletedError } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (refreshedCompletedError || !refreshedCompleted) {
      throw new Error(
        refreshedCompletedError?.message ?? "Failed to reload completed generation job"
      );
    }

    return refreshedCompleted;
  } catch (error) {
    const { data: failed, error: failedError } = await supabase
      .from("shopreel_media_generation_jobs")
      .update({
        status: "failed",
        error_text: error instanceof Error ? error.message : "Media generation failed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select("*")
      .single();

    if (failedError || !failed) {
      throw new Error(failedError?.message ?? "Failed to mark generation job failed");
    }

    return failed;
  }
}

export async function listRecentMediaGenerationJobs(limit = 24) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
