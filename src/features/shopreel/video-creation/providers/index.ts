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
      throw new Error(
        "Runway jobs must use the premium Runway launcher/sync pipeline, not the generic media provider runner."
      );
    case "luma":
      throw new Error("Luma provider adapter is not implemented yet.");
    case "pika":
      throw new Error("Pika provider adapter is not implemented yet.");
    default:
      return openAiMediaProvider;
  }
}
