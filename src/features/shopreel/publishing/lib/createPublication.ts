
import { createAdminClient } from "@/lib/supabase/server";
import type { CreatePublicationInput } from "../types";

export async function createPublication(input: CreatePublicationInput) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_publications")
    .insert({
      tenant_shop_id: input.shopId,
      source_shop_id: input.shopId,
      source_system: "profixiq",
      content_piece_id: input.contentPieceId,
      platform_account_id: input.platformAccountId ?? null,
      platform: input.platform,
      status: "queued",
      scheduled_for: input.scheduledFor ?? null,
      published_at: null,
      platform_post_id: null,
      platform_post_url: null,
      error_text: null,
      metadata: {
        publish_mode: input.publishMode ?? "manual",
        content_event_id: input.contentEventId ?? null,
        content_asset_id: input.contentAssetId ?? null,
        created_by: input.createdBy ?? null,
        title: input.title ?? null,
        caption: input.caption ?? null,
        video_id: input.videoId ?? null,
      },
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create publication");
  }

  return data;
}