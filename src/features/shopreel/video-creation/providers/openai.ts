import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";
import { getOpenAIApiKey } from "@/features/shopreel/video-creation/lib/env";
import { normalizeOpenAIVideoSeconds } from "@/features/shopreel/video-creation/lib/normalizeOpenAIVideoSeconds";
import { submitRailwayVideoJob } from "@/features/shopreel/video-creation/lib/railwayClient";
import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult } from "./types";

type OpenAIImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  };
};

function mapAspectRatioToImageSize(aspectRatio: string): string {
  switch (aspectRatio) {
    case "1:1":
      return "1024x1024";
    case "16:9":
      return "1536x1024";
    case "9:16":
      return "1024x1536";
    case "4:5":
      return "1024x1280";
    default:
      return "1024x1024";
  }
}

function mapAspectRatioToVideoSize(aspectRatio: string): string {
  switch (aspectRatio) {
    case "16:9":
      return "1280x720";
    case "9:16":
      return "720x1280";
    default:
      return "720x1280";
  }
}

export const openAiMediaProvider: MediaProviderAdapter = {
  name: "openai",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    const prompt =
      input.promptEnhanced?.trim() ||
      input.prompt?.trim() ||
      "Create a premium high-quality branded media asset.";

    if (input.jobType === "image") {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getOpenAIApiKey()}`,
        },
        body: JSON.stringify({
          model: SHOPREEL_AI_MODELS.image,
          prompt,
          size: mapAspectRatioToImageSize(input.aspectRatio),
        }),
      });

      const json = (await response.json().catch(() => ({}))) as OpenAIImageResponse;

      if (!response.ok) {
        throw new Error(json.error?.message ?? "OpenAI image generation failed");
      }

      const previewUrl = json.data?.[0]?.url ?? null;

      return {
        providerJobId: `openai-image-${input.jobId}`,
        previewUrl,
        providerStatus: "completed",
        resultPayload: {
          provider: "openai",
          mode: "image_generation",
          prompt,
          returned_url: previewUrl,
        },
      };
    }

    if (input.jobType === "video") {
      const seconds = normalizeOpenAIVideoSeconds(input.durationSeconds);
      const railwayJob = await submitRailwayVideoJob({
        localJobId: input.jobId,
        prompt,
        promptEnhanced: input.promptEnhanced,
        aspectRatio: input.aspectRatio,
        durationSeconds: seconds,
        style: input.style,
        visualMode: input.visualMode,
        inputAssetIds: input.inputAssetIds,
        settings: input.settings,
      });

      return {
        providerJobId: railwayJob.id,
        previewUrl: railwayJob.previewUrl ?? null,
        providerStatus: railwayJob.status ?? "queued",
        resultPayload: {
          provider: "railway",
          mode: "railway_video_generation_async",
          prompt,
          railway_job_id: railwayJob.id,
          railway_status: railwayJob.status ?? "queued",
          requested_model: SHOPREEL_AI_MODELS.videoDraft,
          requested_size: mapAspectRatioToVideoSize(input.aspectRatio),
        },
      };
    }

    return {
      providerJobId: `openai-${input.jobId}`,
      previewUrl: null,
      providerStatus: "completed",
      resultPayload: {
        provider: "openai",
        mode: "placeholder",
        note: "OpenAI provider is currently wired for image and video jobs.",
        prompt,
      },
    };
  },
};
