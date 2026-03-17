import { assemblyMediaProvider } from "./assembly";
import { lumaMediaProvider } from "./luma";
import { openAiMediaProvider } from "./openai";
import { pikaMediaProvider } from "./pika";
import { runwayMediaProvider } from "./runway";
import type { MediaProviderAdapter } from "./types";

const REGISTRY: Record<string, MediaProviderAdapter> = {
  openai: openAiMediaProvider,
  runway: runwayMediaProvider,
  pika: pikaMediaProvider,
  luma: lumaMediaProvider,
  assembly: assemblyMediaProvider,
};

export function getMediaProviderAdapter(name: string): MediaProviderAdapter {
  return REGISTRY[name] ?? openAiMediaProvider;
}
