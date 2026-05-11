export * from "./types";
export * from "./openai";
export * from "./runway";
export * from "./luma";
export * from "./pika";
export * from "./assembly";
export * from "./fal";

import type { MediaProviderAdapter } from "./types";
import { openAiMediaProvider } from "./openai";
import { runwayMediaProvider } from "./runwayAdapter";
import { falMediaProvider } from "./fal";

export function getMediaProviderAdapter(provider: string): MediaProviderAdapter {
  switch (provider) {
    case "fal":
      return falMediaProvider;
    case "openai":
      return openAiMediaProvider;
    case "runway":
      return runwayMediaProvider;
    default:
      return openAiMediaProvider;
  }
}
