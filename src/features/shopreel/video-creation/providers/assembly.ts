import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult } from "./types";

export const assemblyMediaProvider: MediaProviderAdapter = {
  name: "assembly",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    return {
      providerJobId: `assembly-${input.jobId}`,
      previewUrl: null,
      resultPayload: {
        provider: "assembly",
        mode: "placeholder",
        note: "Asset assembly provider hook not wired yet.",
        inputAssetIds: input.inputAssetIds,
      },
    };
  },
};
