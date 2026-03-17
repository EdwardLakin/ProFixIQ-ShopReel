import type { Json } from "@/types/supabase";

export type MediaProviderJobInput = {
  jobId: string;
  provider: string;
  jobType: string;
  prompt: string | null;
  promptEnhanced: string | null;
  negativePrompt: string | null;
  style: string | null;
  visualMode: string | null;
  aspectRatio: string;
  durationSeconds: number | null;
  inputAssetIds: string[];
  settings: Json;
};

export type MediaProviderResult = {
  providerJobId: string | null;
  previewUrl: string | null;
  resultPayload: Json;
};

export interface MediaProviderAdapter {
  name: string;
  run(input: MediaProviderJobInput): Promise<MediaProviderResult>;
}
