import { getOpenAIApiKey } from "@/features/shopreel/video-creation/lib/env";
import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult } from "./types";

type OpenAIImageResponse = {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
};

function mapAspectRatioToSize(aspectRatio: string): string {
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

export const openAiMediaProvider: MediaProviderAdapter = {
  name: "openai",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    if (input.jobType !== "image") {
      return {
        providerJobId: `openai-${input.jobId}`,
        previewUrl: null,
        resultPayload: {
          provider: "openai",
          mode: "placeholder",
          note: "OpenAI provider is currently wired for image jobs only.",
          prompt: input.prompt,
          promptEnhanced: input.promptEnhanced,
        },
      };
    }

    const prompt =
      input.promptEnhanced?.trim() ||
      input.prompt?.trim() ||
      "Create a premium high-quality branded image.";

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getOpenAIApiKey()}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: mapAspectRatioToSize(input.aspectRatio),
      }),
    });

    const json = (await response.json().catch(() => ({}))) as OpenAIImageResponse & {
      error?: { message?: string };
      created?: number;
    };

    if (!response.ok) {
      throw new Error(json.error?.message ?? "OpenAI image generation failed");
    }

    const previewUrl = json.data?.[0]?.url ?? null;

    return {
      providerJobId: `openai-${input.jobId}`,
      previewUrl,
      resultPayload: {
        provider: "openai",
        mode: "image_generation",
        prompt,
        returned_url: previewUrl,
      },
    };
  },
};
