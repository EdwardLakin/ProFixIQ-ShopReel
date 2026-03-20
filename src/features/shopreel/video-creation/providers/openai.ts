import { getOpenAIApiKey } from "@/features/shopreel/video-creation/lib/env";
import { normalizeOpenAIVideoSeconds } from "@/features/shopreel/video-creation/lib/normalizeOpenAIVideoSeconds";
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

type OpenAIVideoCreateResponse = {
  id?: string;
  status?: "queued" | "in_progress" | "completed" | "failed";
  progress?: number;
  seconds?: string | number;
  size?: string;
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
          model: "gpt-image-1",
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

      const response = await fetch("https://api.openai.com/v1/videos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getOpenAIApiKey()}`,
        },
        body: (() => {
          const form = new FormData();
          form.append("model", "sora-2");
          form.append("prompt", prompt);
          form.append("size", mapAspectRatioToVideoSize(input.aspectRatio));
          form.append("seconds", String(seconds));
          return form;
        })(),
      });

      const json = (await response.json().catch(() => ({}))) as OpenAIVideoCreateResponse;

      if (!response.ok || !json.id) {
        throw new Error(json.error?.message ?? "OpenAI video generation failed to start");
      }

      return {
        providerJobId: json.id,
        previewUrl: null,
        providerStatus: json.status ?? "queued",
        resultPayload: {
          provider: "openai",
          mode: "video_generation_async",
          prompt,
          openai_video_id: json.id,
          openai_status: json.status ?? "queued",
          progress: json.progress ?? null,
          seconds: json.seconds ?? null,
          size: json.size ?? null,
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
