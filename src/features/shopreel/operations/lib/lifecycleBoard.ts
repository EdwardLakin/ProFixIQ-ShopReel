import {
  COMPLETED_PUBLISH_JOB_STATUS,
  FAILED_PUBLISH_JOB_STATUS,
  FAILED_PUBLICATION_STATUS,
  PROCESSING_PUBLISH_JOB_STATUS,
  PUBLISHED_PUBLICATION_STATUS,
  PUBLISHING_PUBLICATION_STATUS,
  QUEUED_PUBLISH_JOB_STATUS,
  QUEUED_PUBLICATION_STATUS,
  type PublishJobStatus,
  type PublicationStatus,
} from "@/features/shopreel/lib/contracts/lifecycle";
import {
  computeGenerationPublishReadiness,
  type PublishReadinessBlockReason,
} from "@/features/shopreel/operations/lib/publishReadiness";

export type BoardBlockReason = PublishReadinessBlockReason | "publish_job_failed" | "unsupported_state";

export type BoardBlockReasonLabel = {
  reason: BoardBlockReason;
  label: string;
};

export type OperationGeneration = {
  id: string;
  status: string;
  review_approval_state: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_note: string | null;
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

export type OperationContentPiece = {
  id: string;
  render_url: string | null;
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

export function splitLifecycleBoardBuckets(input: {
  generations: OperationGeneration[];
  renderJobs: OperationRenderJob[];
  contentPieces: OperationContentPiece[];
  publications: OperationPublication[];
  publishJobs: OperationPublishJob[];
  readiness: PublishReadinessContext;
}) {
  const { generations, renderJobs, contentPieces, publications, publishJobs, readiness } = input;

  const renderJobsById = new Map(renderJobs.map((job) => [job.id, job]));
  const contentPiecesById = new Map(contentPieces.map((piece) => [piece.id, piece]));
  const publishJobByPublicationId = new Map(publishJobs.map((job) => [job.publication_id, job]));
  const publicationsByContentPiece = new Map<string, OperationPublication[]>();

  for (const publication of publications) {
    if (!publication.content_piece_id) continue;
    const list = publicationsByContentPiece.get(publication.content_piece_id) ?? [];
    list.push(publication);
    publicationsByContentPiece.set(publication.content_piece_id, list);
  }

  const needsReview: OperationGeneration[] = [];
  const rejected: OperationGeneration[] = [];
  const approvedRenderBlocked: Array<{ generation: OperationGeneration; reason: BoardBlockReasonLabel }> = [];
  const readyToPublish: OperationGeneration[] = [];
  const publishBlocked: Array<{ generation: OperationGeneration; reason: BoardBlockReasonLabel }> = [];

  for (const generation of generations) {
    const associated = generation.content_piece_id
      ? publicationsByContentPiece.get(generation.content_piece_id) ?? []
      : [];

    const readinessResult = computeGenerationPublishReadiness({
      generation,
      renderJob: generation.render_job_id ? renderJobsById.get(generation.render_job_id) ?? null : null,
      contentPiece: generation.content_piece_id ? contentPiecesById.get(generation.content_piece_id) ?? null : null,
      publications: associated,
      hasConnectedPlatformAccount: readiness.hasConnectedPlatformAccount,
    });

    if (readinessResult.state === "needs_review") {
      needsReview.push(generation);
      continue;
    }

    if (readinessResult.state === "rejected") {
      rejected.push(generation);
      continue;
    }

    if (readinessResult.state === "approved_render_blocked") {
      approvedRenderBlocked.push({
        generation,
        reason: {
          reason: readinessResult.blockedBy ?? "unsupported_state",
          label: readinessResult.label,
        },
      });
      continue;
    }

    if (readinessResult.state === "approved_publish_blocked") {
      publishBlocked.push({
        generation,
        reason: {
          reason: readinessResult.blockedBy ?? "unsupported_state",
          label: readinessResult.label,
        },
      });
      continue;
    }

    if (readinessResult.state === "ready_to_publish") {
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
      const failedStatus = status === FAILED_PUBLICATION_STATUS || publishJob?.status === FAILED_PUBLISH_JOB_STATUS;

      if (!failedStatus) {
        return null;
      }

      const reason = publishJob?.error_message ?? publication.error_text ?? "Publish failed";

      return { publication, reason };
    })
    .filter((value): value is { publication: OperationPublication; reason: string } => !!value);

  return {
    needsReview,
    rejected,
    approvedRenderBlocked,
    readyToPublish,
    publishBlocked,
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
