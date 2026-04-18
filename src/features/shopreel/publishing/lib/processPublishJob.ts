import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import { getPublicationPayload } from "./getPublicationPayload";
import {
  COMPLETED_PUBLISH_JOB_STATUS,
  FAILED_PUBLISH_JOB_STATUS,
  PROCESSING_PUBLISH_JOB_STATUS,
  PUBLISHED_PUBLICATION_STATUS,
  PUBLISHING_PUBLICATION_STATUS,
  FAILED_PUBLICATION_STATUS,
} from "@/features/shopreel/lib/contracts/lifecycle";

type PublishJobRow = {
  id: string;
  publication_id: string;
  shop_id: string;
  attempt_count: number | null;
};

type PublicationPayloadRow = {
  id: string;
  tenant_shop_id?: string;
  source_shop_id?: string;
  content_piece_id?: string | null;
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

export async function processPublishJob(
  jobId: string,
  options?: { shopId?: string },
) {
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

  if (options?.shopId && job.shop_id !== options.shopId) {
    throw new Error("Publish job does not belong to requested shop");
  }

  await supabase
    .from("shopreel_publish_jobs")
    .update({
      status: PROCESSING_PUBLISH_JOB_STATUS,
      attempt_count: (job.attempt_count ?? 0) + 1,
      locked_at: new Date().toISOString(),
      locked_by: "worker:publish",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  const payload = await getPublicationPayload(job.publication_id);
  const publication = payload.publication as unknown as PublicationPayloadRow;
  const video = payload.video as VideoPayloadRow;

  if (!video.render_url) {
    throw new Error("Video has no render_url");
  }

  const shopId = publication.tenant_shop_id;
  if (!shopId) {
    throw new Error("Publication has no tenant shop id");
  }

  if (job.shop_id !== shopId) {
    throw new Error("Publish job tenant scope does not match publication tenant scope");
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
      contentPieceId: publication.content_piece_id ?? null,
    });

    const publicationMetadata = jsonObject(publication.metadata);

    await supabase
      .from("content_publications")
      .update({
        status:
          result.status === PUBLISHED_PUBLICATION_STATUS
            ? PUBLISHED_PUBLICATION_STATUS
            : PUBLISHING_PUBLICATION_STATUS,
        published_at:
          result.status === PUBLISHED_PUBLICATION_STATUS
            ? new Date().toISOString()
            : null,
        platform_post_id: result.remotePostId,
        platform_post_url: result.remotePostUrl ?? null,
        error_text: null,
        metadata: {
          ...publicationMetadata,
          last_attempt_at: new Date().toISOString(),
          attempt_count: (job.attempt_count ?? 0) + 1,
          publish_result: result,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", publication.id);

    if (publication.content_piece_id) {
      await supabase.from("content_events").insert({
        tenant_shop_id: shopId,
        source_shop_id: shopId,
        source_system: "shopreel",
        content_piece_id: publication.content_piece_id,
        event_type: "published",
        occurred_at: new Date().toISOString(),
        payload: {
          publication_id: publication.id,
          platform: publication.platform,
          remote_post_id: result.remotePostId ?? null,
          remote_post_url: result.remotePostUrl ?? null,
        },
      } as never);
    }

    await supabase
      .from("shopreel_publish_jobs")
      .update({
        status: COMPLETED_PUBLISH_JOB_STATUS,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      .from("content_publications")
      .update({
        status: FAILED_PUBLICATION_STATUS,
        error_text: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", publication.id);

    await supabase
      .from("shopreel_publish_jobs")
      .update({
        status: FAILED_PUBLISH_JOB_STATUS,
        completed_at: new Date().toISOString(),
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    throw error;
  }
}
