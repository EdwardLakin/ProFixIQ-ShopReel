import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult } from "./types";

export const openAiMediaProvider: MediaProviderAdapter = {
  name: "openai",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    return {
      providerJobId: `openai-${input.jobId}`,
      previewUrl: null,
      resultPayload: {
        provider: "openai",
        mode: "placeholder",
        note: "OpenAI media provider hook not wired yet.",
        prompt: input.prompt,
        promptEnhanced: input.promptEnhanced,
        negativePrompt: input.negativePrompt,
      },
    };
  },
};
