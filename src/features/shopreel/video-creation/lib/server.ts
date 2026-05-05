import { createAdminClient, createClient } from "@/lib/supabase/server";
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
import { normalizeOpenAIVideoSeconds } from "./normalizeOpenAIVideoSeconds";

type MediaGenerationJobInsert =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Insert"];

type MediaGenerationJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

type ContentAssetInsert =
  Database["public"]["Tables"]["content_assets"]["Insert"];

async function getShopReelVideoScope(): Promise<{ shopId: string; userId: string | null; standalone: boolean }> {
  const authSupabase = await createClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  let shopId: string | null = null;
  try {
    shopId = await getCurrentShopId();
  } catch {
    shopId = null;
  }

  if (shopId) {
    return { shopId, userId: user?.id ?? null, standalone: false };
  }

  if (!user?.id) {
    throw new Error("Please sign in to create videos.");
  }

  return { shopId: user.id, userId: user.id, standalone: true };
}

function normalizeJobDurationSeconds(
  provider: string,
  jobType: string,
  durationSeconds: number | null | undefined
): number | null {
  if (jobType !== "video") return null;
  if (provider === "openai") {
    return normalizeOpenAIVideoSeconds(durationSeconds);
  }
  return durationSeconds ?? 8;
}

export async function createMediaGenerationJob(
  input: VideoCreationFormInput
): Promise<MediaGenerationJobRow> {
  const supabase = createAdminClient();
  const scope = await getShopReelVideoScope();
  const shopId = scope.shopId;

  const normalizedDurationSeconds = normalizeJobDurationSeconds(
    input.provider,
    input.jobType,
    input.durationSeconds
  );

  const enhancedPrompt = await enhancePromptWithBrandVoice({
    prompt: input.prompt || null,
    style: input.style,
    visualMode: input.visualMode,
    aspectRatio: input.aspectRatio,
    durationSeconds: input.jobType === "image" ? null : normalizedDurationSeconds,
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
    duration_seconds: normalizedDurationSeconds,
    input_asset_ids: input.inputAssetIds,
    settings: {
      requested_provider: input.provider,
      requested_job_type: input.jobType,
      title: input.title,
      voiceover_mode: input.voiceoverMode ?? "ai_voice",
      voiceover_script: input.voiceoverScript ?? null,
      music_direction: input.musicDirection ?? "modern_product_demo",
      custom_music_direction: input.customMusicDirection ?? null,
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

async function createOutputAsset(args: {
  shopId: string;
  title: string | null;
  assetType: "photo" | "video";
  metadata: Json;
  publicUrl?: string | null;
  storagePath?: string | null;
  bucket?: string | null;
  mimeType?: string | null;
}): Promise<string> {
  const supabase = createAdminClient();

  const insertPayload: ContentAssetInsert = {
    tenant_shop_id: args.shopId,
    source_shop_id: args.shopId,
    source_system: "shopreel",
    asset_type: args.assetType,
    title: args.title,
    metadata: args.metadata,
    public_url: args.publicUrl ?? null,
    storage_path: args.storagePath ?? null,
    bucket: args.bucket ?? null,
    mime_type: args.mimeType ?? null,
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

export async function finalizeCompletedMediaJob(args: {
  completedJob: MediaGenerationJobRow;
  providerResult: {
    providerJobId: string | null;
    previewUrl: string | null;
    resultPayload: Json;
  };
  storage?: {
    publicUrl: string | null;
    storagePath: string | null;
    bucket: string | null;
  } | null;
}) {
  const supabase = createAdminClient();

  const outputAssetId = await createOutputAsset({
    shopId: args.completedJob.shop_id,
    title: args.completedJob.title,
    assetType: args.completedJob.job_type === "image" ? "photo" : "video",
    publicUrl: args.storage?.publicUrl ?? args.providerResult.previewUrl ?? null,
    storagePath: args.storage?.storagePath ?? null,
    bucket: args.storage?.bucket ?? null,
    mimeType: args.completedJob.job_type === "image" ? "image/png" : "video/mp4",
    metadata: {
      generated_by: "shopreel_video_creation",
      provider: args.completedJob.provider,
      provider_job_id: args.providerResult.providerJobId,
      job_type: args.completedJob.job_type,
      prompt: args.completedJob.prompt,
      prompt_enhanced: args.completedJob.prompt_enhanced,
      style: args.completedJob.style,
      visual_mode: args.completedJob.visual_mode,
      aspect_ratio: args.completedJob.aspect_ratio,
      duration_seconds: args.completedJob.duration_seconds,
      provider_result: args.providerResult.resultPayload,
      real_provider_output: true,
    } satisfies Json,
  });

  const { data: completed, error: completeError } = await supabase
    .from("shopreel_media_generation_jobs")
    .update({
      status: "completed",
      provider_job_id: args.providerResult.providerJobId,
      preview_url: args.storage?.publicUrl ?? args.providerResult.previewUrl ?? null,
      output_asset_id: outputAssetId,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      result_payload: {
        output_asset_id: outputAssetId,
        provider: args.completedJob.provider,
        provider_job_id: args.providerResult.providerJobId,
        preview_url: args.storage?.publicUrl ?? args.providerResult.previewUrl ?? null,
        provider_result: args.providerResult.resultPayload,
        real_provider_output: true,
      },
    })
    .eq("id", args.completedJob.id)
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
    .eq("id", args.completedJob.id)
    .single();

  if (refreshedCompletedError || !refreshedCompleted) {
    throw new Error(
      refreshedCompletedError?.message ?? "Failed to reload completed generation job"
    );
  }

  return refreshedCompleted;
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
    const normalizedDurationSeconds = normalizeJobDurationSeconds(
      job.provider,
      job.job_type,
      job.duration_seconds
    );

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
      durationSeconds: normalizedDurationSeconds,
      inputAssetIds: job.input_asset_ids ?? [],
      settings: job.settings,
    });

    if (job.job_type === "video" && providerResult.providerStatus !== "completed") {
      const { data: processingJob, error: processingError } = await supabase
        .from("shopreel_media_generation_jobs")
        .update({
          status: "processing",
          provider_job_id: providerResult.providerJobId,
          preview_url: providerResult.previewUrl,
          updated_at: new Date().toISOString(),
          result_payload: {
            provider: job.provider,
            provider_job_id: providerResult.providerJobId,
            provider_status: providerResult.providerStatus ?? "queued",
            provider_result: providerResult.resultPayload,
            async_video: true,
          },
        })
        .eq("id", job.id)
        .select("*")
        .single();

      if (processingError || !processingJob) {
        throw new Error(processingError?.message ?? "Failed to persist async video job");
      }

      return processingJob;
    }

    return finalizeCompletedMediaJob({
      completedJob: job,
      providerResult: {
        providerJobId: providerResult.providerJobId,
        previewUrl: providerResult.previewUrl,
        resultPayload: providerResult.resultPayload,
      },
      storage: null,
    });
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
  const { shopId } = await getShopReelVideoScope();

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


export async function getSeriesJobsByKey(seriesKey: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).filter((job) => {
    const settings =
      job.settings && typeof job.settings === "object" && !Array.isArray(job.settings)
        ? (job.settings as Record<string, unknown>)
        : null;

    return settings?.series_key === seriesKey;
  });

  rows.sort((a, b) => {
    const aSettings =
      a.settings && typeof a.settings === "object" && !Array.isArray(a.settings)
        ? (a.settings as Record<string, unknown>)
        : null;
    const bSettings =
      b.settings && typeof b.settings === "object" && !Array.isArray(b.settings)
        ? (b.settings as Record<string, unknown>)
        : null;

    const aOrder = Number(aSettings?.series_scene_order ?? 999);
    const bOrder = Number(bSettings?.series_scene_order ?? 999);

    return aOrder - bOrder;
  });

  return rows;
}
