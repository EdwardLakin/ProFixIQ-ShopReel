import type { MediaProviderAdapter } from "./types";
import { createRunwaySceneJob } from "./runway";

export const runwayMediaProvider: MediaProviderAdapter = {
  async run(input) {
    const job = await createRunwaySceneJob({
      promptText: input.promptEnhanced || input.prompt || "Scene",
      promptImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      duration: input.durationSeconds === 10 ? 10 : 5,
      ratio: "720:1280",
      model: "gen4_turbo",
    });

    return {
      providerJobId: job.providerTaskId,
      previewUrl: null,
      providerStatus: "processing",
      resultPayload: {
        provider: "runway",
        task_id: job.providerTaskId,
      },
    };
  },
};
