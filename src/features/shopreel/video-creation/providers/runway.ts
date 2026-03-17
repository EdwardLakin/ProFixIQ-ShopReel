import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult } from "./types";

export const runwayMediaProvider: MediaProviderAdapter = {
  name: "runway",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    return {
      providerJobId: `runway-${input.jobId}`,
      previewUrl: null,
      resultPayload: {
        provider: "runway",
        mode: "placeholder",
        note: "Runway media provider hook not wired yet.",
        prompt: input.prompt,
        promptEnhanced: input.promptEnhanced,
      },
    };
  },
};
