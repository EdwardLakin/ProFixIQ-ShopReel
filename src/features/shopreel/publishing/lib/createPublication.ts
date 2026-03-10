import { createAdminClient } from "@/lib/supabase/server";
import type { CreatePublicationInput } from "../types";

export async function createPublication(input: CreatePublicationInput) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_publications")
    .insert({
      shop_id: input.shopId,
      content_event_id: input.contentEventId,
      content_piece_id: input.contentPieceId ?? null,
      content_asset_id: input.contentAssetId ?? null,
      platform_account_id: input.platformAccountId ?? null,
      platform: input.platform,
      status: "queued",
      scheduled_for: input.scheduledFor ?? null,
      created_by: input.createdBy ?? null,
      title: input.title ?? null,
      caption: input.caption ?? null,
      metadata: {
        publish_mode: input.publishMode ?? "manual",
        video_id: input.videoId ?? null,
      },
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create publication");
  }

  return data;
}