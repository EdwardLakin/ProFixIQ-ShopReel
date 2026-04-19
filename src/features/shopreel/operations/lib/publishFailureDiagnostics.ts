import {
  FAILED_PUBLISH_JOB_STATUS,
  FAILED_PUBLICATION_STATUS,
  PROCESSING_PUBLISH_JOB_STATUS,
  PUBLISHING_PUBLICATION_STATUS,
  QUEUED_PUBLISH_JOB_STATUS,
  QUEUED_PUBLICATION_STATUS,
  type PublishJobStatus,
  type PublicationStatus,
} from "@/features/shopreel/lib/contracts/lifecycle";

export type PublishFailureReason =
  | "no_connected_account"
  | "auth_expired"
  | "platform_rejected"
  | "missing_content_artifact"
  | "render_not_ready"
  | "invalid_state"
  | "transient_network_error"
  | "queue_error"
  | "unknown_publish_failure";

export type PublishFailureDiagnosticsInput = {
  publication: {
    id: string;
    status: PublicationStatus | string;
    error_text: string | null;
    content_piece_id: string | null;
    platform_account_id?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  publishJob: {
    id: string;
    status: PublishJobStatus | string;
    error_message: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    completed_at?: string | null;
    attempt_count?: number | null;
  } | null;
  contentPiece: {
    id: string;
    render_url: string | null;
  } | null;
  hasConnectedPlatformAccount: boolean;
};

export type PublishFailureDiagnostics = {
  reason: PublishFailureReason;
  reasonLabel: string;
  retryable: boolean;
  retryabilityLabel: string;
  summary: string;
  lastAttemptedAt: string | null;
  currentPublicationStatus: string;
  currentPublishJobStatus: string | null;
};

const NETWORK_ERROR_MATCH = /(timeout|timed out|econnreset|enotfound|network|socket|fetch failed|temporar|rate limit)/i;
const AUTH_ERROR_MATCH = /(token|oauth|unauthori|forbidden|permission|session|expired|invalid.?grant)/i;
const NO_ACCOUNT_ERROR_MATCH = /(not connected|no connected|missing account|account id is missing|page id is missing|business account id is missing)/i;
const QUEUE_ERROR_MATCH = /(queue|enqueue|worker|job not found|publish job)/i;
const PLATFORM_REJECTION_MATCH = /(failed to publish|invalid parameter|unsupported|not wired yet|not implemented)/i;

function readLastAttemptAt(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  const value = metadata.last_attempt_at;
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
}

function failureText(input: PublishFailureDiagnosticsInput): string {
  return input.publishJob?.error_message ?? input.publication.error_text ?? "Publish failed";
}

function classifyReason(input: PublishFailureDiagnosticsInput, message: string): PublishFailureReason {
  const publicationStatus = String(input.publication.status);
  const jobStatus = input.publishJob?.status ? String(input.publishJob.status) : null;

  if (!input.hasConnectedPlatformAccount || NO_ACCOUNT_ERROR_MATCH.test(message)) {
    return "no_connected_account";
  }

  if (!input.publication.content_piece_id) {
    return "invalid_state";
  }

  const renderUrl = input.contentPiece?.render_url;
  if (!renderUrl || renderUrl.trim().length === 0) {
    if (
      publicationStatus === QUEUED_PUBLICATION_STATUS ||
      publicationStatus === PUBLISHING_PUBLICATION_STATUS
    ) {
      return "render_not_ready";
    }
    return "missing_content_artifact";
  }

  if (AUTH_ERROR_MATCH.test(message)) {
    return "auth_expired";
  }

  if (NETWORK_ERROR_MATCH.test(message)) {
    return "transient_network_error";
  }

  if (QUEUE_ERROR_MATCH.test(message)) {
    return "queue_error";
  }

  if (PLATFORM_REJECTION_MATCH.test(message)) {
    return "platform_rejected";
  }

  if (
    publicationStatus === QUEUED_PUBLICATION_STATUS ||
    publicationStatus === PUBLISHING_PUBLICATION_STATUS ||
    jobStatus === QUEUED_PUBLISH_JOB_STATUS ||
    jobStatus === PROCESSING_PUBLISH_JOB_STATUS
  ) {
    return "queue_error";
  }

  if (publicationStatus !== FAILED_PUBLICATION_STATUS && jobStatus !== FAILED_PUBLISH_JOB_STATUS) {
    return "invalid_state";
  }

  return "unknown_publish_failure";
}

function reasonLabel(reason: PublishFailureReason): string {
  switch (reason) {
    case "no_connected_account":
      return "No connected account";
    case "auth_expired":
      return "Account auth expired";
    case "platform_rejected":
      return "Platform rejected publish";
    case "missing_content_artifact":
      return "Missing content artifact";
    case "render_not_ready":
      return "Render not ready";
    case "invalid_state":
      return "Invalid publish state";
    case "transient_network_error":
      return "Transient network error";
    case "queue_error":
      return "Queue/worker error";
    case "unknown_publish_failure":
    default:
      return "Unknown publish failure";
  }
}

export function isPublishFailureRetryable(reason: PublishFailureReason): boolean {
  switch (reason) {
    case "transient_network_error":
    case "queue_error":
      return true;
    case "unknown_publish_failure":
      return false;
    case "no_connected_account":
    case "auth_expired":
    case "platform_rejected":
    case "missing_content_artifact":
    case "render_not_ready":
    case "invalid_state":
    default:
      return false;
  }
}

export function computePublishFailureDiagnostics(
  input: PublishFailureDiagnosticsInput,
): PublishFailureDiagnostics {
  const summary = failureText(input);
  const reason = classifyReason(input, summary);
  const retryable = isPublishFailureRetryable(reason);

  const metadataLastAttempt = readLastAttemptAt(input.publication.metadata);
  const lastAttemptedAt =
    metadataLastAttempt ??
    input.publishJob?.completed_at ??
    input.publishJob?.updated_at ??
    input.publication.updated_at ??
    input.publishJob?.created_at ??
    input.publication.created_at ??
    null;

  return {
    reason,
    reasonLabel: reasonLabel(reason),
    retryable,
    retryabilityLabel: retryable ? "Retryable now" : "Blocked until operator action",
    summary,
    lastAttemptedAt,
    currentPublicationStatus: String(input.publication.status),
    currentPublishJobStatus: input.publishJob?.status ? String(input.publishJob.status) : null,
  };
}

export type PublishNextAction = {
  label: string;
  href: string;
};

export function getPublishFailureNextAction(input: {
  reason: PublishFailureReason;
  generationId: string | null;
  contentPieceId: string | null;
  retryable: boolean;
}): PublishNextAction {
  if (input.retryable) {
    return { label: "Inspect queue and retry", href: "/shopreel/publish-queue" };
  }

  switch (input.reason) {
    case "no_connected_account":
    case "auth_expired":
      return { label: "Open publishing settings", href: "/shopreel/settings" };
    case "missing_content_artifact":
    case "render_not_ready":
      if (input.generationId) {
        return { label: "Fix content/render first", href: `/shopreel/generations/${input.generationId}` };
      }
      if (input.contentPieceId) {
        return { label: "Open content record", href: `/shopreel/content/${input.contentPieceId}` };
      }
      return { label: "Inspect publish detail", href: "/shopreel/publish-queue" };
    case "platform_rejected":
    case "invalid_state":
    case "unknown_publish_failure":
    case "queue_error":
    default:
      return { label: "Inspect publication/job detail", href: "/shopreel/publish-queue" };
  }
}
