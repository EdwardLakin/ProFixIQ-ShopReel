import { createAdminClient } from "@/lib/supabase/server";
import type { CreatePublicationInput } from "../types";

export async function createPublication(input: CreatePublicationInput) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shopreel_publications")
    .insert({
      shop_id: input.shopId,
      video_id: input.videoId,
      platform: input.platform,
      status: "queued",
      publish_mode: input.publishMode ?? "manual",
      scheduled_for: input.scheduledFor ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create publication");
  }

  return data;
}