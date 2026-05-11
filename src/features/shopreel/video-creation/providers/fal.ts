import { getFalApiKey, getShopreelFalVideoModel } from "@/features/shopreel/video-creation/lib/env";
import type { MediaProviderAdapter, MediaProviderJobInput, MediaProviderResult, NormalizedProviderStatus } from "./types";

type FalQueueResponse = {
  request_id?: string;
  status?: string;
  response_url?: string;
  error?: string;
};

type FalStatusResponse = {
  status?: string;
  video?: { url?: string };
  output?: { url?: string };
  error?: string;
};

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "fal.ai request failed";
}

function mapFalStatus(status: string | undefined): NormalizedProviderStatus {
  const normalized = (status ?? "").toLowerCase();
  if (["completed", "success", "succeeded"].includes(normalized)) return "completed";
  if (["failed", "error", "canceled", "cancelled"].includes(normalized)) return "failed";
  if (["in_progress", "running", "processing"].includes(normalized)) return "processing";
  if (["queued", "pending", "created"].includes(normalized)) return "queued";
  return "waiting_for_provider";
}

export const falMediaProvider: MediaProviderAdapter = {
  name: "fal",
  async run(input: MediaProviderJobInput): Promise<MediaProviderResult> {
    const apiKey = getFalApiKey();
    if (!apiKey) {
      throw new Error("fal.ai is not configured for video generation.");
    }

    const model = getShopreelFalVideoModel();
    const prompt = input.promptEnhanced?.trim() || input.prompt?.trim() || "Create a premium high-quality branded video asset.";

    try {
      // TODO(phase-17): confirm the canonical fal.ai model endpoint and payload fields in production.
      const response = await fetch(`https://queue.fal.run/${model}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify({
          prompt,
          duration: input.durationSeconds ?? 8,
          aspect_ratio: input.aspectRatio,
        }),
      });

      const json = (await response.json().catch(() => ({}))) as FalQueueResponse;
      if (!response.ok) {
        throw new Error(json.error || `fal.ai submit failed (${response.status})`);
      }

      return {
        providerJobId: json.request_id ?? null,
        previewUrl: null,
        providerStatus: json.request_id ? "waiting_for_provider" : mapFalStatus(json.status),
        model,
        capability: { image: false, video: true, audio: false, assemblyRender: false, async: true, supportsPolling: true, maxDurationSeconds: null },
        resultPayload: { provider: "fal", model, submit_response: json, lifecycle_stage: "submit" },
      };
    } catch (error) {
      throw new Error(safeErrorMessage(error));
    }
  },
  async poll(input) {
    const apiKey = getFalApiKey();
    if (!apiKey) {
      throw new Error("fal.ai is not configured for video generation.");
    }
    const model = getShopreelFalVideoModel();

    try {
      // TODO(phase-17): verify the polling URL and response payload shape against live fal.ai docs/account.
      const response = await fetch(`https://queue.fal.run/${model}/requests/${input.providerJobId}/status`, {
        method: "GET",
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      });

      const json = (await response.json().catch(() => ({}))) as FalStatusResponse;
      if (!response.ok) {
        throw new Error(json.error || `fal.ai poll failed (${response.status})`);
      }

      const outputUrl = json.video?.url ?? json.output?.url ?? null;
      const providerStatus = mapFalStatus(json.status);

      return {
        providerJobId: input.providerJobId,
        previewUrl: outputUrl,
        outputUrl,
        providerStatus,
        model,
        capability: { image: false, video: true, audio: false, assemblyRender: false, async: true, supportsPolling: true, maxDurationSeconds: null },
        errorMessage: providerStatus === "failed" ? json.error ?? "fal.ai generation failed" : null,
        resultPayload: { provider: "fal", model, poll_response: json, lifecycle_stage: "poll" },
      };
    } catch (error) {
      throw new Error(safeErrorMessage(error));
    }
  },
};
