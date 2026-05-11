import { getIntegrationLifecycleTruth, type IntegrationLifecycleTruthState } from "@/features/shopreel/integrations/shared/lifecycleTruth";

export type PublishReadinessState =
  | "ready_to_queue"
  | "needs_review"
  | "needs_render_export"
  | "platform_not_live_ready"
  | "queued_internal"
  | "failed_retryable"
  | "failed_operator_action";

export type PublishReadinessBlockerCode =
  | "missing_content"
  | "missing_render_output"
  | "needs_review"
  | "missing_caption"
  | "missing_thumbnail"
  | "platform_not_live_ready"
  | "platform_blocked_state"
  | "platform_not_connected"
  | "platform_capability_missing";

export type PublishReadinessIssue = {
  code: PublishReadinessBlockerCode;
  label: string;
};

export type PlatformReadiness = {
  platform: string;
  lifecycle_state: IntegrationLifecycleTruthState;
  can_queue: boolean;
  can_publish_live: boolean;
  blockers: PublishReadinessIssue[];
  warnings: PublishReadinessIssue[];
};

export type PublishReadinessModel = {
  readiness_score: number;
  readiness_state: PublishReadinessState;
  blockers: PublishReadinessIssue[];
  warnings: PublishReadinessIssue[];
  platform_readiness: PlatformReadiness;
  recommended_next_action: string;
  can_queue: boolean;
  can_publish_live: boolean;
  retry_available: boolean;
};

export function buildPublishReadinessModel(input: {
  platform: string;
  hasContent: boolean;
  hasRenderOutput: boolean;
  reviewApproved: boolean;
  hasConnectedAccount: boolean;
  hasCaption: boolean;
  hasThumbnail: boolean;
  publishFailed?: boolean;
  retryAvailable?: boolean;
  realismDegradationScore?: number;
  emotionalAuthenticityScore?: number;
}): PublishReadinessModel {
  const truth = getIntegrationLifecycleTruth(input.platform as any);
  const blockers: PublishReadinessIssue[] = [];
  const warnings: PublishReadinessIssue[] = [];

  if (!input.hasContent) blockers.push({ code: "missing_content", label: "Missing content piece" });
  if (!input.reviewApproved) blockers.push({ code: "needs_review", label: "Needs explicit review approval" });
  if (!input.hasRenderOutput) blockers.push({ code: "missing_render_output", label: "Render/export output not ready" });
  if (!input.hasConnectedAccount && truth.publishReady) blockers.push({ code: "platform_not_connected", label: "No connected platform account" });
  if (truth.state === "planned" || truth.state === "mock" || truth.state === "disabled") {
    blockers.push({ code: "platform_blocked_state", label: `Platform lifecycle state is ${truth.state}` });
  }
  if (!truth.publishReady) {
    warnings.push({ code: "platform_not_live_ready", label: "Platform does not support live publish in this surface" });
  }
  if (!input.hasCaption) warnings.push({ code: "missing_caption", label: "Caption is missing" });
  if (!input.hasThumbnail) warnings.push({ code: "missing_thumbnail", label: "Thumbnail is missing" });
  if ((input.realismDegradationScore ?? 0) > 60) {
    warnings.push({ code: "missing_caption", label: "Narrative realism degraded: reduce AI-polished language and over-clean emotional arcs." });
  }

  const canPublishLive = blockers.length === 0 && truth.publishReady;
  const canQueue = blockers.filter((b) => b.code !== "platform_blocked_state").length === 0 && (truth.publishReady || truth.state === "partial");

  let readinessState: PublishReadinessState = "ready_to_queue";
  if (!input.reviewApproved) readinessState = "needs_review";
  else if (!input.hasRenderOutput) readinessState = "needs_render_export";
  else if (!truth.publishReady) readinessState = "platform_not_live_ready";
  if (input.publishFailed) readinessState = input.retryAvailable ? "failed_retryable" : "failed_operator_action";

  const recommended =
    readinessState === "needs_review" ? "Approve in review handoff before queueing." :
    readinessState === "needs_render_export" ? "Run render/export and attach output before publish." :
    readinessState === "platform_not_live_ready" ? "Prepare draft/package only; live external publish is unavailable." :
    readinessState === "failed_retryable" ? "Retry from publish queue and monitor worker attempts." :
    readinessState === "failed_operator_action" ? "Resolve blocker in settings or content package before retry." :
    (input.realismDegradationScore ?? 0) > 60 ? "Revise scene behavior, texture, and dialogue realism before publishing." :
    "Queue now, then monitor internal queue until external publish proof is persisted.";

  const score = Math.max(0, Math.min(100, 100 - blockers.length * 25 - warnings.length * 7));

  return {
    readiness_score: score,
    readiness_state: readinessState,
    blockers,
    warnings,
    platform_readiness: {
      platform: input.platform,
      lifecycle_state: truth.state,
      can_queue: canQueue,
      can_publish_live: canPublishLive,
      blockers,
      warnings,
    },
    recommended_next_action: recommended,
    can_queue: canQueue,
    can_publish_live: canPublishLive,
    retry_available: !!input.retryAvailable,
  };
}
