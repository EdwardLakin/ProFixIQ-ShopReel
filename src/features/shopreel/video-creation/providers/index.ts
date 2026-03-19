export * from "./types";
export * from "./openai";
export * from "./runway";
export * from "./luma";
export * from "./pika";
export * from "./assembly";

import type { MediaProviderAdapter } from "./types";
import { openAiMediaProvider } from "./openai";

export function getMediaProviderAdapter(provider: string): MediaProviderAdapter {
  switch (provider) {
    case "openai":
      return openAiMediaProvider;
    case "runway":
      return openAiMediaProvider;
    case "luma":
      return openAiMediaProvider;
    case "pika":
      return openAiMediaProvider;
    default:
      return openAiMediaProvider;
  }
}
