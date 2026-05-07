import type { Json } from "@/types/supabase";

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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getRailwayBaseUrl() {
  return requireEnv("SHOPREEL_RAILWAY_VIDEO_BASE_URL").replace(/\/+$/, "");
}

function getRailwayApiKey() {
  return requireEnv("SHOPREEL_RAILWAY_VIDEO_API_KEY");
}

export async function submitRailwayVideoJob(payload: RailwayVideoRequest): Promise<RailwayVideoResponse> {
  const response = await fetch(`${getRailwayBaseUrl()}/jobs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${getRailwayApiKey()}`,
    },
    body: JSON.stringify(payload),
  });
  const json = (await response.json().catch(() => ({}))) as RailwayVideoResponse;
  if (!response.ok || !json.id) {
    throw new Error(json.error ?? "Railway video service rejected create request.");
  }
  return json;
}

export async function fetchRailwayVideoJob(jobId: string): Promise<RailwayVideoResponse> {
  const response = await fetch(`${getRailwayBaseUrl()}/jobs/${jobId}`, {
    method: "GET",
    headers: { authorization: `Bearer ${getRailwayApiKey()}` },
  });
  const json = (await response.json().catch(() => ({}))) as RailwayVideoResponse;
  if (!response.ok) {
    throw new Error(json.error ?? "Railway video service rejected status request.");
  }
  return json;
}
