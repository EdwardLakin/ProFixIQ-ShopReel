import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import type { WorkflowType, WorkflowStage } from "@/features/shopreel/ui/system/workflowTransitionModel";

export type RecoveryReason =
  | "resumable_workflow"
  | "pending_review"
  | "interrupted_generation"
  | "awaiting_publish_prep"
  | "failed_publish_attempt"
  | "draft_continuity";

export type RecoveryItemDescriptor = {
  id: string;
  workflow_type: WorkflowType;
  entity_id: string;
  current_stage: WorkflowStage;
  recovery_reason: RecoveryReason;
  recommended_next_action: string;
  resume_route: string;
  updated_at: string;
};

type RecoverySource = {
  route: string;
  generationId?: string;
  campaignId?: string;
  interrupted?: boolean;
  hasReviewItems?: boolean;
  hasPublishReady?: boolean;
  hasPublishFailures?: boolean;
  hasDraftContinuity?: boolean;
};

const MAX_RECOVERY_ITEMS = 6;

export function buildRecoveryInbox(input: RecoverySource): RecoveryItemDescriptor[] {
  const now = new Date().toISOString();
  const items: RecoveryItemDescriptor[] = [];
  const route = input.route || "/shopreel";

  if (input.interrupted) {
    items.push({
      id: "interrupted-generation",
      workflow_type: "generation",
      entity_id: input.generationId ?? "latest-generation",
      current_stage: "resume",
      recovery_reason: "interrupted_generation",
      recommended_next_action: "Resume generation workflow",
      resume_route: input.generationId ? `/shopreel/generations/${input.generationId}` : "/shopreel/generations",
      updated_at: now,
    });
  }
  if (input.hasReviewItems) {
    items.push({
      id: "pending-review",
      workflow_type: "generation",
      entity_id: input.generationId ?? "review-queue",
      current_stage: "review",
      recovery_reason: "pending_review",
      recommended_next_action: "Open review queue",
      resume_route: input.generationId ? `/shopreel/review/${input.generationId}` : "/shopreel/review",
      updated_at: now,
    });
  }
  if (input.hasPublishReady) {
    items.push({
      id: "awaiting-publish-prep",
      workflow_type: "publish",
      entity_id: input.generationId ?? "export-queue",
      current_stage: "publish",
      recovery_reason: "awaiting_publish_prep",
      recommended_next_action: "Prepare publish package",
      resume_route: "/shopreel/publish-queue",
      updated_at: now,
    });
  }
  if (input.hasPublishFailures) {
    items.push({
      id: "failed-publish-attempt",
      workflow_type: "publish",
      entity_id: input.generationId ?? "publish-job",
      current_stage: "publish",
      recovery_reason: "failed_publish_attempt",
      recommended_next_action: "Resolve failed publish attempt",
      resume_route: "/shopreel/publish-queue",
      updated_at: now,
    });
  }
  if (input.campaignId) {
    items.push({
      id: "resumable-campaign-workflow",
      workflow_type: "campaign",
      entity_id: input.campaignId,
      current_stage: "planning",
      recovery_reason: "resumable_workflow",
      recommended_next_action: "Resume campaign continuity",
      resume_route: `/shopreel/campaigns/${input.campaignId}`,
      updated_at: now,
    });
  }
  if (input.hasDraftContinuity) {
    items.push({
      id: "draft-continuity",
      workflow_type: "create",
      entity_id: input.generationId ?? "draft",
      current_stage: "building",
      recovery_reason: "draft_continuity",
      recommended_next_action: "Continue draft continuity",
      resume_route: route,
      updated_at: now,
    });
  }

  return items.slice(0, MAX_RECOVERY_ITEMS);
}

export function readRecoveryInbox(memory: WorkspaceMemory | null): RecoveryItemDescriptor[] {
  return memory?.recoveryInbox ?? [];
}
