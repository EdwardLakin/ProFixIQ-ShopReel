import { createAdminClient } from "@/lib/supabase/server";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import { getPublicationPayload } from "./getPublicationPayload";

export async function processPublishJob(jobId: string) {
  const supabase = createAdminClient();

  const { data: job, error: jobError } = await supabase
    .from("shopreel_publish_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    throw new Error(jobError?.message ?? "Publish job not found");
  }

  await supabase
    .from("shopreel_publish_jobs")
    .update({
      status: "processing",
      attempt_count: (job.attempt_count ?? 0) + 1,
      locked_at: new Date().toISOString(),
      locked_by: "worker:publish",
    } as never)
    .eq("id", jobId);

  const { publication, video } = await getPublicationPayload(job.publication_id);

  if (!video.render_url) {
    const message = "Video has no render_url";

    await supabase
      .from("shopreel_publish_jobs")
      .update({
        status: "failed",
        error_message: message,
      } as never)
      .eq("id", jobId);

    await supabase
      .from("shopreel_publications")
      .update({
        status: "failed",
        error_message: message,
        last_attempt_at: new Date().toISOString(),
      } as never)
      .eq("id", publication.id);

    throw new Error(message);
  }

  const integration = getPlatformIntegration(publication.platform);

  const result = await integration.publishVideo({
    shopId: publication.shop_id,
    platform: publication.platform,
    title: video.title,
    caption: video.caption,
    videoUrl: video.render_url,
    thumbnailUrl: video.thumbnail_url,
  });

  await supabase
    .from("shopreel_publications")
    .update({
      status: result.status === "published" ? "published" : "processing",
      published_at: result.status === "published" ? new Date().toISOString() : null,
      remote_post_id: result.remotePostId,
      title_sent: video.title,
      caption_sent: video.caption,
      video_url_sent: video.render_url,
      thumbnail_url_sent: video.thumbnail_url,
      last_attempt_at: new Date().toISOString(),
      attempt_count: (publication.attempt_count ?? 0) + 1,
      error_message: null,
    } as never)
    .eq("id", publication.id);

  await supabase
    .from("shopreel_publish_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      error_message: null,
    } as never)
    .eq("id", jobId);

  return {
    ok: true,
    jobId,
    publicationId: publication.id,
    result,
  };
}
