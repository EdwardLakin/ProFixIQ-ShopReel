export type RuntimeEntityKind =
  | "campaign"
  | "upload"
  | "idea"
  | "script"
  | "hook"
  | "render_job"
  | "approval"
  | "thumbnail"
  | "publishing_queue"
  | "ai_task"
  | "generation"
  | "content_piece"
  | "publication"
  | "manual_asset"
  | "opportunity"
  | "review_item"
  | "calendar_item"
  | "automation_task"
  | "analytics_snapshot";

export type RuntimeEntity = {
  id: string;
  kind: RuntimeEntityKind;
  title: string;
  unresolved: boolean;
  metadata: Record<string, unknown>;
};

export type RuntimePanel = {
  id: string;
  title: string;
  entityId: string | null;
  docked: boolean;
  stackOrder: number;
  sideSurface: "left" | "right" | "center";
};

export type RuntimeWorkspaceState = {
  entities: RuntimeEntity[];
  focusedEntityId: string | null;
  pinnedEntityIds: string[];
  queuedEntityIds: string[];
  panels: RuntimePanel[];
};

export function openEntity(state: RuntimeWorkspaceState, entity: RuntimeEntity): RuntimeWorkspaceState {
  const existing = state.entities.find((candidate) => candidate.id === entity.id);
  const entities = existing ? state.entities.map((candidate) => (candidate.id === entity.id ? entity : candidate)) : [...state.entities, entity];
  return { ...state, entities, focusedEntityId: entity.id };
}

export function focusEntity(state: RuntimeWorkspaceState, entityId: string): RuntimeWorkspaceState {
  return { ...state, focusedEntityId: entityId };
}

export function pinEntity(state: RuntimeWorkspaceState, entityId: string): RuntimeWorkspaceState {
  if (state.pinnedEntityIds.includes(entityId)) return state;
  return { ...state, pinnedEntityIds: [...state.pinnedEntityIds, entityId] };
}

export function queueEntity(state: RuntimeWorkspaceState, entityId: string): RuntimeWorkspaceState {
  if (state.queuedEntityIds.includes(entityId)) return state;
  return { ...state, queuedEntityIds: [...state.queuedEntityIds, entityId] };
}

export function transitionToEntity(state: RuntimeWorkspaceState, entityId: string): RuntimeWorkspaceState {
  const existing = state.entities.find((entity) => entity.id === entityId);
  if (!existing) return state;
  return { ...state, focusedEntityId: entityId };
}
