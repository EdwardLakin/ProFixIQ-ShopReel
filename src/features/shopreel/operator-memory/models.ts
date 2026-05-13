import type { OperatorIntentSnapshot, OperatorOrchestrationPlan } from "@/features/shopreel/ui/system/operatorOrchestration";

export type OperatorIntent =
  | "reviewing"
  | "editing"
  | "approving"
  | "rendering"
  | "uploading"
  | "ideating"
  | "publishing";

export type OperatorSession = {
  id: string;
  shopId: string;
  userId: string;
  sessionStatus: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type OperatorMemoryRecord = {
  id: string;
  shopId: string;
  userId: string;
  sessionId: string | null;
  memoryKey: string;
  memoryKind:
    | "active_campaign"
    | "pending_approval"
    | "pending_render"
    | "unfinished_draft"
    | "recent_upload"
    | "operator_focus"
    | "stalled_entity"
    | "creator_pattern"
    | "continuity";
  unresolved: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceContinuation = {
  focusIntent: OperatorIntent;
  unresolvedMemoryKeys: string[];
  recentlyActiveEntity: { kind: string; id: string } | null;
  pendingApprovalCount: number;
  likelyNextStep: string;
  continuitySummary: string;
  orchestrationIntent: OperatorIntentSnapshot | null;
  orchestrationPlan: OperatorOrchestrationPlan | null;
};

export type OperatorWorkspaceState = {
  id: string;
  shopId: string;
  userId: string;
  sessionId: string | null;
  runtimeState: string;
  activeRoute: string;
  focusedEntityKind: string | null;
  focusedEntityId: string | null;
  unresolvedCount: number;
  continuitySnapshot: WorkspaceContinuation;
  createdAt: string;
  updatedAt: string;
};
