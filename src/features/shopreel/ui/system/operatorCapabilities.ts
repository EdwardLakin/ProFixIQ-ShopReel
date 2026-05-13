import type { OperatorWorldCard, OperatorWorldKind } from "@/features/shopreel/operator/operatorWorlds";

export type OperatorCapability =
  | "campaign_planning"
  | "campaign_refinement"
  | "content_generation"
  | "content_editing"
  | "upload_intake"
  | "asset_library"
  | "opportunity_review"
  | "approval_review"
  | "render_management"
  | "publish_management"
  | "calendar_planning"
  | "automation_monitoring"
  | "analytics_review"
  | "workspace_recovery";

export type OperatorActionKind = "open" | "continue_latest" | "review" | "retry" | "schedule" | "analyze" | "recover";

export type OperatorActionTarget = {
  entityKind: OperatorWorldKind;
  entityId: string;
  href: string;
  capability: OperatorCapability;
};

export type OperatorAction = {
  kind: OperatorActionKind;
  label: string;
  target: OperatorActionTarget;
};

export type OperatorActionResult = {
  ok: boolean;
  route: string;
  reason: string;
};

export type OperatorWorkflowStage = "triage" | "active_work" | "review" | "finalize" | "recovery";

export type OperatorCapabilityDefinition = {
  capability: OperatorCapability;
  entityKinds: OperatorWorldKind[];
  route: string;
  allowedActions: OperatorActionKind[];
  nextLikelyActions: OperatorActionKind[];
  reviewRequired: boolean;
  fallbackRoute: string;
  displayLabel: string;
  workflowStage: OperatorWorkflowStage;
};

export type OperatorRuntimeCapabilityMap = Record<OperatorCapability, OperatorCapabilityDefinition>;

export const operatorCapabilityRegistry: OperatorRuntimeCapabilityMap = {
  campaign_planning: { capability: "campaign_planning", entityKinds: ["campaign"], route: "/shopreel/campaigns/new", allowedActions: ["open", "continue_latest"], nextLikelyActions: ["review", "schedule"], reviewRequired: false, fallbackRoute: "/shopreel/campaigns", displayLabel: "Campaign planning", workflowStage: "active_work" },
  campaign_refinement: { capability: "campaign_refinement", entityKinds: ["campaign"], route: "/shopreel/campaigns", allowedActions: ["open", "continue_latest", "review"], nextLikelyActions: ["review", "schedule"], reviewRequired: true, fallbackRoute: "/shopreel/campaigns", displayLabel: "Campaign refinement", workflowStage: "active_work" },
  content_generation: { capability: "content_generation", entityKinds: ["generation"], route: "/shopreel/generations", allowedActions: ["open", "continue_latest", "review"], nextLikelyActions: ["review", "retry"], reviewRequired: true, fallbackRoute: "/shopreel/generations", displayLabel: "Content generation", workflowStage: "active_work" },
  content_editing: { capability: "content_editing", entityKinds: ["content_piece"], route: "/shopreel/content", allowedActions: ["open", "continue_latest", "review"], nextLikelyActions: ["review", "schedule"], reviewRequired: true, fallbackRoute: "/shopreel/content", displayLabel: "Content editing", workflowStage: "active_work" },
  upload_intake: { capability: "upload_intake", entityKinds: ["manual_asset"], route: "/shopreel/upload", allowedActions: ["open", "continue_latest"], nextLikelyActions: ["open"], reviewRequired: false, fallbackRoute: "/shopreel/upload", displayLabel: "Upload intake", workflowStage: "triage" },
  asset_library: { capability: "asset_library", entityKinds: ["manual_asset"], route: "/shopreel/library", allowedActions: ["open"], nextLikelyActions: ["continue_latest"], reviewRequired: false, fallbackRoute: "/shopreel/library", displayLabel: "Asset library", workflowStage: "triage" },
  opportunity_review: { capability: "opportunity_review", entityKinds: ["opportunity"], route: "/shopreel/opportunities", allowedActions: ["open", "review"], nextLikelyActions: ["open", "continue_latest"], reviewRequired: false, fallbackRoute: "/shopreel/opportunities", displayLabel: "Opportunity review", workflowStage: "triage" },
  approval_review: { capability: "approval_review", entityKinds: ["review_item", "generation"], route: "/shopreel/review", allowedActions: ["open", "review", "continue_latest"], nextLikelyActions: ["open", "schedule"], reviewRequired: true, fallbackRoute: "/shopreel/review", displayLabel: "Approval review", workflowStage: "review" },
  render_management: { capability: "render_management", entityKinds: ["render_job"], route: "/shopreel/render-jobs", allowedActions: ["open", "retry"], nextLikelyActions: ["review", "schedule"], reviewRequired: false, fallbackRoute: "/shopreel/render-jobs", displayLabel: "Render management", workflowStage: "active_work" },
  publish_management: { capability: "publish_management", entityKinds: ["publication"], route: "/shopreel/publish-center", allowedActions: ["open", "schedule", "continue_latest"], nextLikelyActions: ["analyze"], reviewRequired: false, fallbackRoute: "/shopreel/publish-center", displayLabel: "Publish management", workflowStage: "finalize" },
  calendar_planning: { capability: "calendar_planning", entityKinds: ["calendar_item", "publication"], route: "/shopreel/calendar", allowedActions: ["open", "schedule"], nextLikelyActions: ["open", "analyze"], reviewRequired: false, fallbackRoute: "/shopreel/calendar", displayLabel: "Calendar planning", workflowStage: "finalize" },
  automation_monitoring: { capability: "automation_monitoring", entityKinds: ["campaign", "render_job", "publication"], route: "/shopreel/automation", allowedActions: ["open", "retry", "recover"], nextLikelyActions: ["open"], reviewRequired: false, fallbackRoute: "/shopreel/automation", displayLabel: "Automation monitoring", workflowStage: "recovery" },
  analytics_review: { capability: "analytics_review", entityKinds: ["publication", "campaign"], route: "/shopreel/analytics", allowedActions: ["open", "analyze"], nextLikelyActions: ["continue_latest"], reviewRequired: false, fallbackRoute: "/shopreel/analytics", displayLabel: "Analytics review", workflowStage: "finalize" },
  workspace_recovery: { capability: "workspace_recovery", entityKinds: ["campaign", "generation", "content_piece", "render_job", "publication", "manual_asset", "opportunity", "review_item", "calendar_item"], route: "/shopreel/operations", allowedActions: ["recover", "open"], nextLikelyActions: ["continue_latest"], reviewRequired: false, fallbackRoute: "/shopreel/operations", displayLabel: "Workspace recovery", workflowStage: "recovery" },
};

export function resolveCapabilityForWorld(world: Pick<OperatorWorldCard, "kind" | "normalizedStatus">): OperatorCapability {
  if (world.kind === "review_item") return "approval_review";
  if (world.kind === "generation") return world.normalizedStatus.includes("review") ? "approval_review" : "content_generation";
  if (world.kind === "campaign") return world.normalizedStatus.includes("blocked") ? "automation_monitoring" : "campaign_refinement";
  if (world.kind === "content_piece") return "content_editing";
  if (world.kind === "render_job") return "render_management";
  if (world.kind === "publication") return "publish_management";
  if (world.kind === "manual_asset") return "upload_intake";
  if (world.kind === "opportunity") return "opportunity_review";
  if (world.kind === "calendar_item") return "calendar_planning";
  return "workspace_recovery";
}
