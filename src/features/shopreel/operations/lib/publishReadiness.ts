import {
  FAILED_PUBLICATION_STATUS,
  FAILED_RENDER_JOB_STATUS,
  PUBLISHED_PUBLICATION_STATUS,
  QUEUED_PUBLICATION_STATUS,
  PUBLISHING_PUBLICATION_STATUS,
  REVIEW_APPROVAL_APPROVED_STATE,
  REVIEW_APPROVAL_NEEDS_CHANGES_STATE,
  REVIEW_APPROVAL_NEEDS_REVIEW_STATE,
  STORY_GENERATION_FAILED_STATUS,
  type ReviewApprovalState,
} from "@/features/shopreel/lib/contracts/lifecycle";

export type PublishReadinessBlockReason =
  | "needs_review"
  | "rejected"
  | "render_failed"
  | "missing_render_output"
  | "missing_content_piece"
  | "missing_content_artifact"
  | "publish_failed"
  | "already_scheduled_or_published"
  | "publish_in_progress"
  | "no_connected_account";

export type PublishReadinessState =
  | "needs_review"
  | "rejected"
  | "approved_render_blocked"
  | "approved_publish_blocked"
  | "ready_to_publish"
  | "scheduled_or_published";

export type PublishReadinessResult = {
  state: PublishReadinessState;
  blockedBy: PublishReadinessBlockReason | null;
  label: string;
};

export type ReadinessGeneration = {
  status: string;
  review_approval_state: string | null;
  render_job_id: string | null;
  content_piece_id: string | null;
  generation_metadata: Record<string, unknown> | null;
};

export type ReadinessRenderJob = {
  status: string;
  error_message: string | null;
} | null;

export type ReadinessContentPiece = {
  render_url: string | null;
} | null;

export type ReadinessPublication = {
  status: string;
  scheduled_for: string | null;
}[];

function normalizeReviewState(value: string | null): ReviewApprovalState {
  if (value === REVIEW_APPROVAL_APPROVED_STATE) return value;
  if (value === REVIEW_APPROVAL_NEEDS_CHANGES_STATE) return value;
  return REVIEW_APPROVAL_NEEDS_REVIEW_STATE;
}

function hasGenerationRenderUrl(generation: ReadinessGeneration): boolean {
  const metadata = generation.generation_metadata;
  return !!(metadata && typeof metadata.render_url === "string" && metadata.render_url.trim().length > 0);
}

function hasContentRenderUrl(contentPiece: ReadinessContentPiece): boolean {
  return !!(contentPiece && typeof contentPiece.render_url === "string" && contentPiece.render_url.trim().length > 0);
}

export function computeGenerationPublishReadiness(input: {
  generation: ReadinessGeneration;
  renderJob: ReadinessRenderJob;
  contentPiece: ReadinessContentPiece;
  publications: ReadinessPublication;
  hasConnectedPlatformAccount: boolean;
}): PublishReadinessResult {
  const { generation, renderJob, contentPiece, publications, hasConnectedPlatformAccount } = input;
  const reviewState = normalizeReviewState(generation.review_approval_state);

  if (reviewState === REVIEW_APPROVAL_NEEDS_REVIEW_STATE) {
    return { state: "needs_review", blockedBy: "needs_review", label: "Needs explicit review approval" };
  }

  if (reviewState === REVIEW_APPROVAL_NEEDS_CHANGES_STATE) {
    return { state: "rejected", blockedBy: "rejected", label: "Sent back for changes" };
  }

  if (renderJob?.status === FAILED_RENDER_JOB_STATUS || generation.status === STORY_GENERATION_FAILED_STATUS) {
    return { state: "approved_render_blocked", blockedBy: "render_failed", label: renderJob?.error_message ?? "Render failed" };
  }

  if (!generation.render_job_id || (!hasGenerationRenderUrl(generation) && !hasContentRenderUrl(contentPiece))) {
    return { state: "approved_render_blocked", blockedBy: "missing_render_output", label: "Missing render output" };
  }

  if (!generation.content_piece_id) {
    return { state: "approved_render_blocked", blockedBy: "missing_content_piece", label: "Missing content piece link" };
  }

  if (!hasContentRenderUrl(contentPiece) && !hasGenerationRenderUrl(generation)) {
    return { state: "approved_render_blocked", blockedBy: "missing_content_artifact", label: "Missing publishable content artifact" };
  }

  const hasPublishedOrScheduled = publications.some(
    (publication) => publication.status === PUBLISHED_PUBLICATION_STATUS || !!publication.scheduled_for,
  );

  if (hasPublishedOrScheduled) {
    return { state: "scheduled_or_published", blockedBy: "already_scheduled_or_published", label: "Already scheduled or published" };
  }

  const hasActivePublish = publications.some(
    (publication) => publication.status === QUEUED_PUBLICATION_STATUS || publication.status === PUBLISHING_PUBLICATION_STATUS,
  );

  if (hasActivePublish) {
    return { state: "approved_publish_blocked", blockedBy: "publish_in_progress", label: "Already queued for publish" };
  }

  const hasPublishFailure = publications.some((publication) => publication.status === FAILED_PUBLICATION_STATUS);
  if (hasPublishFailure) {
    return { state: "approved_publish_blocked", blockedBy: "publish_failed", label: "Latest publication failed" };
  }

  if (!hasConnectedPlatformAccount) {
    return { state: "approved_publish_blocked", blockedBy: "no_connected_account", label: "No connected publishing account" };
  }

  return { state: "ready_to_publish", blockedBy: null, label: "Ready to publish" };
}
