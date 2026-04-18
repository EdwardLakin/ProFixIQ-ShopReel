import { createAdminClient } from "@/lib/supabase/server";
import type { CreatePublicationInput } from "../types";
import { QUEUED_PUBLICATION_STATUS } from "@/features/shopreel/lib/contracts/lifecycle";

export async function createPublication(input: CreatePublicationInput) {
  if (!input.contentPieceId) {
    throw new Error("contentPieceId is required");
  }

  if (
    input.platform !== "instagram" &&
    input.platform !== "facebook" &&
    input.platform !== "tiktok" &&
    input.platform !== "youtube"
  ) {
    throw new Error(`Unsupported platform for content_publications: ${input.platform}`);
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_publications")
    .insert({
      tenant_shop_id: input.shopId,
      source_shop_id: input.shopId,
      source_system: "shopreel",
      content_piece_id: input.contentPieceId,
      platform_account_id: input.platformAccountId ?? null,
      platform: input.platform,
      status: QUEUED_PUBLICATION_STATUS,
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
        content_piece_id: input.contentPieceId ?? null,
        story_source_id: input.storySourceId ?? null,
        story_source_kind: input.storySourceKind ?? null,
      },
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create publication");
  }

  return data;
}
