import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import { getPublicationPayload } from "./getPublicationPayload";

type PublishJobRow = {
  id: string;
  publication_id: string;
  attempt_count: number | null;
};

type PublicationPayloadRow = {
  id: string;
  tenant_shop_id?: string;
  source_shop_id?: string;
  platform:
    | "instagram"
    | "facebook"
    | "youtube"
    | "tiktok"
    | "blog"
    | "linkedin"
    | "google_business"
    | "email";
  metadata: Json;
};

type VideoPayloadRow = {
  title: string;
  caption: string | null;
  render_url: string | null;
  thumbnail_url: string | null;
};

function jsonObject(value: Json | null | undefined): Record<string, Json> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, Json>;
  }
  return {};
}

export async function processPublishJob(jobId: string) {
  const supabase = createAdminClient();

  const { data: jobData, error: jobError } = await supabase
    .from("shopreel_publish_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  const job = jobData as PublishJobRow | null;

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
    })
    .eq("id", jobId);

  const payload = await getPublicationPayload(job.publication_id);
  const publication = payload.publication as unknown as PublicationPayloadRow;
  const video = payload.video as VideoPayloadRow;

  if (!video.render_url) {
    throw new Error("Video has no render_url");
  }

  const shopId = publication.tenant_shop_id ?? publication.source_shop_id;
  if (!shopId) {
    throw new Error("Publication has no shop id");
  }

  try {
    const integration = getPlatformIntegration(publication.platform);

    const result = await integration.publishVideo({
      shopId,
      platform: publication.platform,
      title: video.title,
      caption: video.caption,
      videoUrl: video.render_url,
      thumbnailUrl: video.thumbnail_url,
      publicationId: publication.id,
    });

    const publicationMetadata = jsonObject(publication.metadata);

    await supabase
      .from("content_publications")
      .update({
        status: result.status === "published" ? "published" : "publishing",
        published_at:
          result.status === "published" ? new Date().toISOString() : null,
        platform_post_id: result.remotePostId,
        platform_post_url: result.remotePostUrl ?? null,
        metadata: {
          ...publicationMetadata,
          last_attempt_at: new Date().toISOString(),
          attempt_count: (job.attempt_count ?? 0) + 1,
        },
      })
      .eq("id", publication.id);

    await supabase
      .from("shopreel_publish_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return {
      ok: true,
      jobId,
      publicationId: publication.id,
      result,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected publish error";

    await supabase
      .from("shopreel_publish_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", jobId);

    throw error;
  }
}
