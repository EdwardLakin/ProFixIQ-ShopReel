export type WorkspaceTimelineEventType =
  | "campaign_created"
  | "generation_created"
  | "review_requested"
  | "approval_granted"
  | "approval_rejected"
  | "render_started"
  | "render_completed"
  | "publish_scheduled"
  | "publish_completed"
  | "operator_edit"
  | "AI_rewrite"
  | "transition_event";

export type WorkspaceTimelineEvent = {
  id: string;
  shopId: string;
  userId: string | null;
  sessionId: string | null;
  entityKind: string;
  entityId: string | null;
  eventType: WorkspaceTimelineEventType;
  unresolved: boolean;
  reasoningTrace: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type WorkspaceTimelineAggregate = {
  recentWorkspaceActivity: WorkspaceTimelineEvent[];
  campaignLineage: Record<string, WorkspaceTimelineEvent[]>;
  unresolvedProgression: WorkspaceTimelineEvent[];
  entityRelationshipTracing: Record<string, string[]>;
};
