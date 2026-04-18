import {
  COMPLETED_PUBLISH_JOB_STATUS,
  FAILED_PUBLISH_JOB_STATUS,
  FAILED_PUBLICATION_STATUS,
  PROCESSING_PUBLISH_JOB_STATUS,
  PUBLISHED_PUBLICATION_STATUS,
  PUBLISHING_PUBLICATION_STATUS,
  QUEUED_PUBLISH_JOB_STATUS,
  QUEUED_PUBLICATION_STATUS,
  STORY_GENERATION_FAILED_STATUS,
  STORY_GENERATION_READY_STATUS,
  type PublishJobStatus,
  type PublicationStatus,
  type StoryGenerationStatus,
} from "@/features/shopreel/lib/contracts/lifecycle";

export type BoardBlockReason =
  | "missing_render_output"
  | "render_failed"
  | "not_review_approved"
  | "publish_job_failed"
  | "no_connected_account"
  | "scheduling_blocked"
  | "unsupported_state";

export type BoardBlockReasonLabel = {
  reason: BoardBlockReason;
  label: string;
};

export type OperationGeneration = {
  id: string;
  status: StoryGenerationStatus | string;
  updated_at: string | null;
  created_at: string | null;
  render_job_id: string | null;
  content_piece_id: string | null;
  story_draft: Record<string, unknown> | null;
  generation_metadata: Record<string, unknown> | null;
};

export type OperationRenderJob = {
  id: string;
  status: string;
  error_message: string | null;
};

export type OperationPublication = {
  id: string;
  content_piece_id: string | null;
  status: PublicationStatus | string;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string | null;
  platform: string | null;
  metadata: Record<string, unknown> | null;
  error_text: string | null;
  platform_post_url: string | null;
};

export type OperationPublishJob = {
  id: string;
  publication_id: string;
  status: PublishJobStatus | string;
  error_message: string | null;
};

export type PublishReadinessContext = {
  hasConnectedPlatformAccount: boolean;
};

function parseIso(value: string | null): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasRenderUrl(generation: OperationGeneration): boolean {
  const metadata = generation.generation_metadata;
  return !!(metadata && typeof metadata.render_url === "string" && metadata.render_url.trim().length > 0);
}

function generationStatus(value: string): StoryGenerationStatus | null {
  switch (value) {
    case "draft":
    case "queued":
    case "processing":
    case "ready":
    case "published":
    case "failed":
      return value;
    default:
      return null;
  }
}

function publicationStatus(value: string): PublicationStatus | null {
  switch (value) {
    case "draft":
    case "queued":
    case "publishing":
    case "published":
    case "failed":
    case "cancelled":
      return value;
    default:
      return null;
  }
}

export function getGenerationBlockReason(
  generation: OperationGeneration,
  renderJobsById: Map<string, OperationRenderJob>,
): BoardBlockReasonLabel | null {
  const status = generationStatus(String(generation.status));

  if (!status) {
    return { reason: "unsupported_state", label: "Unsupported generation status" };
  }

  const linkedRenderJob = generation.render_job_id ? renderJobsById.get(generation.render_job_id) ?? null : null;
  if (linkedRenderJob?.status === "failed") {
    return { reason: "render_failed", label: linkedRenderJob.error_message ?? "Render job failed" };
  }

  if (status === STORY_GENERATION_FAILED_STATUS) {
    return { reason: "render_failed", label: "Generation failed during render" };
  }

  if (!generation.render_job_id || !hasRenderUrl(generation)) {
    return { reason: "missing_render_output", label: "Missing render output" };
  }

  if (status !== STORY_GENERATION_READY_STATUS) {
    return { reason: "not_review_approved", label: "Not review-approved yet" };
  }

  return null;
}

export function splitLifecycleBoardBuckets(input: {
  generations: OperationGeneration[];
  renderJobs: OperationRenderJob[];
  publications: OperationPublication[];
  publishJobs: OperationPublishJob[];
  readiness: PublishReadinessContext;
}) {
  const { generations, renderJobs, publications, publishJobs, readiness } = input;

  const renderJobsById = new Map(renderJobs.map((job) => [job.id, job]));
  const publishJobByPublicationId = new Map(publishJobs.map((job) => [job.publication_id, job]));
  const publicationsByContentPiece = new Map<string, OperationPublication[]>();

  for (const publication of publications) {
    if (!publication.content_piece_id) continue;
    const list = publicationsByContentPiece.get(publication.content_piece_id) ?? [];
    list.push(publication);
    publicationsByContentPiece.set(publication.content_piece_id, list);
  }

  const needsReview: OperationGeneration[] = [];
  const renderBlocked: Array<{ generation: OperationGeneration; reason: BoardBlockReasonLabel }> = [];
  const readyToPublish: OperationGeneration[] = [];

  for (const generation of generations) {
    const reason = getGenerationBlockReason(generation, renderJobsById);

    if (reason) {
      if (reason.reason === "not_review_approved") {
        needsReview.push(generation);
      } else {
        renderBlocked.push({ generation, reason });
      }
      continue;
    }

    const associated = generation.content_piece_id
      ? publicationsByContentPiece.get(generation.content_piece_id) ?? []
      : [];

    const hasScheduled = associated.some((pub) => !!pub.scheduled_for);
    const hasPublished = associated.some(
      (pub) => publicationStatus(String(pub.status)) === PUBLISHED_PUBLICATION_STATUS,
    );

    if (!hasScheduled && !hasPublished) {
      readyToPublish.push(generation);
    }
  }

  const scheduled = publications
    .filter((publication) => !!publication.scheduled_for)
    .sort((a, b) => parseIso(a.scheduled_for) - parseIso(b.scheduled_for));

  const recentlyPublished = publications
    .filter((publication) => publicationStatus(String(publication.status)) === PUBLISHED_PUBLICATION_STATUS)
    .sort((a, b) => parseIso(b.published_at ?? b.created_at) - parseIso(a.published_at ?? a.created_at))
    .slice(0, 30);

  const publishFailures = publications
    .map((publication) => {
      const status = publicationStatus(String(publication.status));
      const publishJob = publishJobByPublicationId.get(publication.id) ?? null;
      const failedStatus =
        status === FAILED_PUBLICATION_STATUS ||
        publishJob?.status === FAILED_PUBLISH_JOB_STATUS;

      if (!failedStatus) {
        return null;
      }

      const reason = publishJob?.error_message ?? publication.error_text ?? "Publish failed";

      return { publication, reason };
    })
    .filter((value): value is { publication: OperationPublication; reason: string } => !!value);

  const readyBlockedReason: BoardBlockReasonLabel | null = readiness.hasConnectedPlatformAccount
    ? null
    : {
        reason: "no_connected_account",
        label: "No connected publishing account for this shop",
      };

  return {
    needsReview,
    renderBlocked,
    readyToPublish,
    readyBlockedReason,
    scheduled,
    recentlyPublished,
    publishFailures,
    queueSummary: {
      queuedPublications: publications.filter(
        (publication) => publicationStatus(String(publication.status)) === QUEUED_PUBLICATION_STATUS,
      ).length,
      publishingPublications: publications.filter(
        (publication) => publicationStatus(String(publication.status)) === PUBLISHING_PUBLICATION_STATUS,
      ).length,
      queuedJobs: publishJobs.filter((job) => job.status === QUEUED_PUBLISH_JOB_STATUS).length,
      processingJobs: publishJobs.filter((job) => job.status === PROCESSING_PUBLISH_JOB_STATUS).length,
      completedJobs: publishJobs.filter((job) => job.status === COMPLETED_PUBLISH_JOB_STATUS).length,
    },
  };
}
