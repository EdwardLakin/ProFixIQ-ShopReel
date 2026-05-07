import type { Json } from "@/types/supabase";
import { getRailwayVideoApiKey, getRailwayVideoBaseUrl } from "./env";

export type RailwayVideoRequest = {
  localJobId: string;
  prompt: string;
  promptEnhanced: string | null;
  aspectRatio: string;
  durationSeconds: number;
  style: string | null;
  visualMode: string | null;
  inputAssetIds: string[];
  settings: Json;
};

export type RailwayVideoResponse = {
  id: string;
  status?: "queued" | "in_progress" | "completed" | "failed";
  previewUrl?: string | null;
  error?: string;
  metadata?: Record<string, unknown>;
};

const RAILWAY_TIMEOUT_MS = 20_000;

async function parseResponse(response: Response) {
  try {
    return (await response.json()) as RailwayVideoResponse;
  } catch {
    throw new Error("Railway video service returned invalid JSON.");
  }
}

export async function submitRailwayVideoJob(payload: RailwayVideoRequest): Promise<RailwayVideoResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RAILWAY_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${getRailwayVideoBaseUrl().replace(/\/+$/, "")}/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${getRailwayVideoApiKey()}`,
        "x-idempotency-key": payload.localJobId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Railway video request timed out. Please retry.");
    }
    throw new Error("Could not reach Railway video service.");
  } finally {
    clearTimeout(timeout);
  }
  const json = await parseResponse(response);
  if (!response.ok) {
    throw new Error(json.error ?? `Railway create request failed with HTTP ${response.status}.`);
  }
  if (!json.id) {
    throw new Error("Railway accepted request but returned no job id.");
  }
  return json;
}

export async function fetchRailwayVideoJob(jobId: string): Promise<RailwayVideoResponse> {
  const response = await fetch(`${getRailwayVideoBaseUrl().replace(/\/+$/, "")}/jobs/${jobId}`, {
    method: "GET",
    headers: { authorization: `Bearer ${getRailwayVideoApiKey()}` },
  });
  const json = await parseResponse(response);
  if (!response.ok) {
    throw new Error(json.error ?? "Railway video service rejected status request.");
  }
  return json;
}
