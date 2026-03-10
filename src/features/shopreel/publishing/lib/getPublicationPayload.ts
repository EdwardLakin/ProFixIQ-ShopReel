import { createAdminClient } from "@/lib/supabase/server";

export async function getPublicationPayload(publicationId: string) {
  const supabase = createAdminClient();

  const { data: publication, error: publicationError } = await supabase
    .from("shopreel_publications")
    .select("id, shop_id, video_id, platform, status, connection_id, attempt_count")
    .eq("id", publicationId)
    .single();

  if (publicationError || !publication) {
    throw new Error(publicationError?.message ?? "Publication not found");
  }

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("id, title, caption, render_url, thumbnail_url")
    .eq("id", publication.video_id)
    .single();

  if (videoError || !video) {
    throw new Error(videoError?.message ?? "Video not found");
  }

  return {
    publication,
    video,
  };
}
