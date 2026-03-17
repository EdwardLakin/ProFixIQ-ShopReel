import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult } from "./types";

export const pikaMediaProvider: MediaProviderAdapter = {
  name: "pika",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    return {
      providerJobId: `pika-${input.jobId}`,
      previewUrl: null,
      resultPayload: {
        provider: "pika",
        mode: "placeholder",
        note: "Pika media provider hook not wired yet.",
        prompt: input.prompt,
        promptEnhanced: input.promptEnhanced,
      },
    };
  },
};
