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

export type NormalizedProviderStatus =
  | "queued"
  | "submitting"
  | "processing"
  | "polling"
  | "completed"
  | "failed"
  | "waiting_for_provider";

export type MediaProviderResult = {
  providerJobId: string | null;
  previewUrl: string | null;
  outputUrl?: string | null;
  providerStatus?: NormalizedProviderStatus;
  errorMessage?: string | null;
  costEstimateCents?: number | null;
  model?: string | null;
  capability?: {
    image: boolean;
    video: boolean;
    audio: boolean;
    assemblyRender: boolean;
    async: boolean;
    supportsPolling: boolean;
    maxDurationSeconds: number | null;
  };
  resultPayload: Json;
};

export interface MediaProviderAdapter {
  name: string;
  run(input: MediaProviderJobInput): Promise<MediaProviderResult>;
  poll?(input: MediaProviderJobInput & { providerJobId: string }): Promise<MediaProviderResult>;
}
