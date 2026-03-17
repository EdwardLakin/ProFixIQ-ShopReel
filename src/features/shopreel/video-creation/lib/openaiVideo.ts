import { createAdminClient } from "@/lib/supabase/server";
import { getGeneratedMediaBucket, getOpenAIApiKey } from "./env";
import type { Database, Json } from "@/types/supabase";

type MediaJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

type OpenAIVideoStatusResponse = {
  id?: string;
  status?: "queued" | "in_progress" | "completed" | "failed";
  progress?: number;
  seconds?: string | number;
  size?: string;
  error?: {
    message?: string;
  };
};

export async function fetchOpenAIVideoStatus(videoId: string) {
  const response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getOpenAIApiKey()}`,
    },
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as OpenAIVideoStatusResponse;

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Failed to fetch OpenAI video status");
  }

  return json;
}

export async function downloadOpenAIVideoContent(videoId: string) {
  const response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getOpenAIApiKey()}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Failed to download OpenAI video content");
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function uploadGeneratedVideoToStorage(args: {
  mediaJob: MediaJobRow;
  videoBytes: Uint8Array;
}) {
  const supabase = createAdminClient();
  const bucket = getGeneratedMediaBucket();

  const fileName = `${args.mediaJob.id}.mp4`;
  const storagePath = `shopreel/generated-videos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, args.videoBytes, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return {
    bucket,
    storagePath,
    publicUrl: data.publicUrl,
  };
}

export function buildOpenAIVideoSyncMetadata(status: OpenAIVideoStatusResponse): Json {
  return {
    openai_video_id: status.id ?? null,
    openai_status: status.status ?? null,
    progress: status.progress ?? null,
    seconds: status.seconds ?? null,
    size: status.size ?? null,
  };
}
