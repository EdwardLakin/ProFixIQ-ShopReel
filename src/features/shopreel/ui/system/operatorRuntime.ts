import type { CommandInputIntent } from "@/features/shopreel/ui/system/commandInputIntent";

export type OperatorRuntimeState =
  | "idle"
  | "interpreting_intent"
  | "planning_campaign"
  | "awaiting_approval"
  | "refining_output"
  | "generating_draft"
  | "assembling_package"
  | "reviewing_decision"
  | "blocked_missing_input"
  | "manual_operations_mode"
  | "completed_export_ready";

export type OperatorSurfaceId =
  | "idle_command"
  | "campaign_planning"
  | "campaign_workspace"
  | "review_inbox"
  | "asset_intake"
  | "publish_package_review"
  | "manual_operations"
  | "blocked_recovery"
  | "export_ready";

export type OperatorTransitionMode = "inline_materialize" | "route_fallback" | "guided_handoff";

export type OperatorRuntimeIntent = CommandInputIntent | "review" | "refine" | "asset_intake" | "publish" | "manual_operations" | "unknown";

export type OperatorRuntimeContext = {
  currentPath?: string;
  selectedCampaignId?: string | null;
  hasPendingApprovals?: boolean;
  hasActiveCampaign?: boolean;
  hasAssetsContext?: boolean;
};

export type OperatorRuntimeResolution = {
  state: OperatorRuntimeState;
  surfaceId: OperatorSurfaceId;
  transitionMode: OperatorTransitionMode;
  confidence: "low" | "medium" | "high";
  summary: string;
  recommendedRouteFallback: string;
  contextCarryover: {
    rawCommand: string;
    interpretedIntent: OperatorRuntimeIntent;
    selectedCampaignId: string | null;
    hasPendingApprovals: boolean;
    hasActiveCampaign: boolean;
    hasAssetsContext: boolean;
  };
};
