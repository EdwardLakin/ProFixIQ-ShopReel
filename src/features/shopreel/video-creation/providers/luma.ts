import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult } from "./types";

export const lumaMediaProvider: MediaProviderAdapter = {
  name: "luma",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    return {
      providerJobId: `luma-${input.jobId}`,
      previewUrl: null,
      resultPayload: {
        provider: "luma",
        mode: "placeholder",
        note: "Luma media provider hook not wired yet.",
        prompt: input.prompt,
        promptEnhanced: input.promptEnhanced,
      },
    };
  },
};
