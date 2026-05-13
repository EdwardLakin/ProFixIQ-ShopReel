import type {
  OperatorRuntimeResolution,
  OperatorRuntimeState,
  OperatorSurfaceId,
  OperatorTransitionMode,
} from "@/features/shopreel/ui/system/operatorRuntime";
import type { RuntimeEntity, RuntimeWorkspaceState } from "@/features/shopreel/runtime/entities";
import type { OperatorAction, OperatorCapability } from "@/features/shopreel/ui/system/operatorCapabilities";
import type { OperatorOrchestrationPlan } from "@/features/shopreel/ui/system/operatorOrchestration";
import { focusEntity, openEntity, pinEntity, queueEntity, transitionToEntity } from "@/features/shopreel/runtime/entities";
import type { RuntimeWorldEntryIntent, RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { GuidedFlowStepId } from "@/features/shopreel/ui/system/guidedWorldFlow";

export type RuntimeWorldBreadcrumb = { worldId: RuntimeWorldId; route: string; at: string; label: string };
export type RuntimeWorldEnvironmentState = { visualSeed: string; backgroundTone: string; returnToDeckHref: string };
export type RuntimeWorldLastAction = { label: string; at: string };
export type RuntimeWorldPanelState = "operator" | "manual" | "timeline" | "actions";
export type RuntimeWorldContinuity = {
  activeWorldId: RuntimeWorldId | null;
  activeWorldKind: string | null;
  activeEntityId: string | null;
  activeRoute: string | null;
  previousWorldId: RuntimeWorldId | null;
  previousRoute: string | null;
  guidedStepId: GuidedFlowStepId | null;
  panelMode: RuntimeWorldPanelState;
  environment: RuntimeWorldEnvironmentState;
  lastAction: RuntimeWorldLastAction | null;
  breadcrumbs: RuntimeWorldBreadcrumb[];
};

export type RuntimeInterruption = {
  reason: string;
  requestedSurface: OperatorSurfaceId;
  returnSurface: OperatorSurfaceId;
  returnState: OperatorRuntimeState;
  at: string;
};

export type RecoverableRuntimeContext = {
  surfaceId: OperatorSurfaceId;
  state: OperatorRuntimeState;
  command: string;
  summary: string;
};

export type OperatorRuntimeSessionState = {
  runtimeState: OperatorRuntimeState;
  activeSurface: OperatorSurfaceId;
  previousSurface: OperatorSurfaceId | null;
  pendingTransition: OperatorTransitionMode | null;
  compressedHero: boolean;
  activeCommand: string;
  lastOperatorSummary: string;
  interruption: RuntimeInterruption | null;
  recoverableContext: RecoverableRuntimeContext | null;
  selectedEntityIds: { campaignId: string | null; generationId: string | null };
  activeEntity: { kind: string; id: string } | null;
  focusedCapability: OperatorCapability | null;
  queuedNextAction: OperatorAction | null;
  pinnedEntities: Array<{ kind: string; id: string }>;
  unresolvedIndicators: string[];
  lastRoute: string | null;
  recoveryTarget: string | null;
  fallbackRoute: string;
  workspace: RuntimeWorkspaceState;
  orchestrationPlan: OperatorOrchestrationPlan | null;
  activeWorldId: RuntimeWorldId | null;
  previousWorldId: RuntimeWorldId | null;
  worldEntryIntent: RuntimeWorldEntryIntent | null;
  focusedWorldEntity: { kind: string; id: string } | null;
  worldRecommendation: string | null;
  worldEntrySnapshot: {
    worldId: RuntimeWorldId;
    href: string;
    entityId: string | null;
    entityKind: string | null;
    title: string;
    status: string;
    visualSeed: string;
    guidedStep: GuidedFlowStepId | null;
  } | null;
  worldTransitionHistory: Array<{ from: RuntimeWorldId | null; to: RuntimeWorldId; at: string; reason: string }>;
  worldContinuity: RuntimeWorldContinuity;
  orchestrationSummary: {
    currentOperationalFocus: string;
    blockedCount: number;
    readyActions: number;
    pendingApprovals: number;
    failedRenders: number;
    publishReadyWork: number;
    staleWorkflows: number;
  } | null;
};

export const initialOperatorRuntimeSession: OperatorRuntimeSessionState = {
  runtimeState: "idle",
  activeSurface: "idle_command",
  previousSurface: null,
  pendingTransition: null,
  compressedHero: false,
  activeCommand: "",
  lastOperatorSummary: "Operator is ready.",
  interruption: null,
  recoverableContext: null,
  selectedEntityIds: { campaignId: null, generationId: null },
  activeEntity: null,
  focusedCapability: null,
  queuedNextAction: null,
  pinnedEntities: [],
  unresolvedIndicators: [],
  lastRoute: null,
  recoveryTarget: null,
  fallbackRoute: "/shopreel",
  workspace: { entities: [], focusedEntityId: null, pinnedEntityIds: [], queuedEntityIds: [], panels: [] },
  orchestrationPlan: null,
  activeWorldId: null,
  previousWorldId: null,
  worldEntryIntent: null,
  focusedWorldEntity: null,
  worldRecommendation: null,
  worldEntrySnapshot: null,
  worldTransitionHistory: [],
  worldContinuity: {
    activeWorldId: null,
    activeWorldKind: null,
    activeEntityId: null,
    activeRoute: null,
    previousWorldId: null,
    previousRoute: null,
    guidedStepId: null,
    panelMode: "operator",
    environment: { visualSeed: "operations:default", backgroundTone: "slate", returnToDeckHref: "/shopreel" },
    lastAction: null,
    breadcrumbs: [],
  },
  orchestrationSummary: null,
};

type StartRuntimeAction = { type: "START_RUNTIME"; resolution: OperatorRuntimeResolution; command: string };
type StartTransitionAction = { type: "START_TRANSITION"; mode: OperatorTransitionMode };
type CompleteTransitionAction = { type: "COMPLETE_TRANSITION" };
type SetCompressedHeroAction = { type: "SET_COMPRESSED_HERO"; compressed: boolean };
type InterruptAction = { type: "INTERRUPT"; interruption: RuntimeInterruption; fallbackRoute: string };
type RecoverAction = { type: "RECOVER" };
type SelectEntityAction = { type: "SELECT_ENTITY"; campaignId?: string | null; generationId?: string | null };
type ApplyReviewDecisionAction = {
  type: "APPLY_REVIEW_DECISION";
  decisionSummary: string;
  nextState: OperatorRuntimeState;
};
type OpenEntityAction = { type: "OPEN_ENTITY"; entity: RuntimeEntity };
type FocusEntityAction = { type: "FOCUS_ENTITY"; entityId: string };
type PinEntityAction = { type: "PIN_ENTITY"; entityId: string };
type QueueEntityAction = { type: "QUEUE_ENTITY"; entityId: string };
type TransitionToEntityAction = { type: "TRANSITION_TO_ENTITY"; entityId: string };
type SetCapabilityContextAction = {
  type: "SET_CAPABILITY_CONTEXT";
  capability: OperatorCapability | null;
  activeEntity?: { kind: string; id: string } | null;
  queuedNextAction?: OperatorAction | null;
  unresolvedIndicators?: string[];
  lastRoute?: string | null;
  recoveryTarget?: string | null;
};
type SetOrchestrationPlanAction = { type: "SET_ORCHESTRATION_PLAN"; plan: OperatorOrchestrationPlan | null };
type SetWorldContextAction = {
  type: "SET_WORLD_CONTEXT";
  activeWorldId: RuntimeWorldId;
  worldEntryIntent?: RuntimeWorldEntryIntent | null;
  focusedWorldEntity?: { kind: string; id: string } | null;
  worldRecommendation?: string | null;
  worldEntrySnapshot?: OperatorRuntimeSessionState["worldEntrySnapshot"];
  reason?: string;
};

export type OperatorRuntimeSessionAction =
  | StartRuntimeAction
  | StartTransitionAction
  | CompleteTransitionAction
  | SetCompressedHeroAction
  | InterruptAction
  | RecoverAction
  | SelectEntityAction
  | ApplyReviewDecisionAction
  | OpenEntityAction
  | FocusEntityAction
  | PinEntityAction
  | QueueEntityAction
  | TransitionToEntityAction
  | SetCapabilityContextAction
  | SetOrchestrationPlanAction
  | SetWorldContextAction;

export function operatorRuntimeSessionReducer(
  state: OperatorRuntimeSessionState,
  action: OperatorRuntimeSessionAction,
): OperatorRuntimeSessionState {
  switch (action.type) {
    case "START_RUNTIME": {
      return {
        ...state,
        runtimeState: action.resolution.state,
        previousSurface: state.activeSurface,
        activeSurface: action.resolution.surfaceId,
        pendingTransition: action.resolution.transitionMode,
        compressedHero: action.resolution.state !== "idle",
        activeCommand: action.command,
        lastOperatorSummary: action.resolution.summary,
        interruption: null,
        fallbackRoute: action.resolution.recommendedRouteFallback,
        lastRoute: action.resolution.recommendedRouteFallback,
        selectedEntityIds: {
          ...state.selectedEntityIds,
          campaignId: action.resolution.contextCarryover.selectedCampaignId,
        },
      };
    }
    case "START_TRANSITION":
      return { ...state, pendingTransition: action.mode };
    case "COMPLETE_TRANSITION":
      return { ...state, pendingTransition: null };
    case "SET_COMPRESSED_HERO":
      return { ...state, compressedHero: action.compressed };
    case "INTERRUPT":
      return {
        ...state,
        interruption: action.interruption,
        recoverableContext: {
          surfaceId: state.activeSurface,
          state: state.runtimeState,
          command: state.activeCommand,
          summary: state.lastOperatorSummary,
        },
        runtimeState: "manual_operations_mode",
        previousSurface: state.activeSurface,
        activeSurface: action.interruption.requestedSurface,
        pendingTransition: "guided_handoff",
        fallbackRoute: action.fallbackRoute,
      };
    case "RECOVER": {
      if (!state.recoverableContext) return state;
      return {
        ...state,
        runtimeState: state.interruption?.returnState ?? state.recoverableContext.state,
        previousSurface: state.activeSurface,
        activeSurface: state.interruption?.returnSurface ?? state.recoverableContext.surfaceId,
        pendingTransition: "inline_materialize",
        lastOperatorSummary: `Recovered previous workflow: ${state.recoverableContext.summary}`,
        interruption: null,
      };
    }
    case "SELECT_ENTITY":
      return {
        ...state,
        selectedEntityIds: {
          campaignId: action.campaignId ?? state.selectedEntityIds.campaignId,
          generationId: action.generationId ?? state.selectedEntityIds.generationId,
        },
      };
    case "APPLY_REVIEW_DECISION":
      return {
        ...state,
        previousSurface: state.activeSurface,
        runtimeState: action.nextState,
        lastOperatorSummary: action.decisionSummary,
      };
    case "OPEN_ENTITY":
      return { ...state, workspace: openEntity(state.workspace, action.entity) };
    case "FOCUS_ENTITY":
      return { ...state, workspace: focusEntity(state.workspace, action.entityId) };
    case "PIN_ENTITY":
      return { ...state, pinnedEntities: [...state.pinnedEntities, { kind: "runtime_entity", id: action.entityId }], workspace: pinEntity(state.workspace, action.entityId) };
    case "QUEUE_ENTITY":
      return { ...state, workspace: queueEntity(state.workspace, action.entityId) };
    case "TRANSITION_TO_ENTITY":
      return { ...state, workspace: transitionToEntity(state.workspace, action.entityId) };
    case "SET_CAPABILITY_CONTEXT":
      return {
        ...state,
        focusedCapability: action.capability,
        activeEntity: action.activeEntity ?? state.activeEntity,
        queuedNextAction: action.queuedNextAction ?? state.queuedNextAction,
        unresolvedIndicators: action.unresolvedIndicators ?? state.unresolvedIndicators,
        lastRoute: action.lastRoute ?? state.lastRoute,
        recoveryTarget: action.recoveryTarget ?? state.recoveryTarget,
      };
    case "SET_ORCHESTRATION_PLAN":
      return {
        ...state,
        orchestrationPlan: action.plan,
        orchestrationSummary: action.plan?.summary ?? null,
      };
    case "SET_WORLD_CONTEXT":
      return {
        ...state,
        previousWorldId: state.activeWorldId,
        activeWorldId: action.activeWorldId,
        worldEntryIntent: action.worldEntryIntent ?? state.worldEntryIntent,
        focusedWorldEntity: action.focusedWorldEntity ?? state.focusedWorldEntity,
        worldRecommendation: action.worldRecommendation ?? state.worldRecommendation,
        worldEntrySnapshot: action.worldEntrySnapshot ?? state.worldEntrySnapshot,
        worldTransitionHistory: [
          {
            from: state.activeWorldId,
            to: action.activeWorldId,
            at: new Date().toISOString(),
            reason: action.reason ?? "world_context_update",
          },
          ...state.worldTransitionHistory,
        ].slice(0, 20),
        worldContinuity: {
          ...state.worldContinuity,
          activeWorldId: action.activeWorldId,
          activeWorldKind: action.worldEntrySnapshot?.entityKind ?? state.worldContinuity.activeWorldKind,
          activeEntityId: action.worldEntrySnapshot?.entityId ?? state.worldContinuity.activeEntityId,
          activeRoute: action.worldEntrySnapshot?.href ?? state.worldContinuity.activeRoute,
          previousWorldId: state.activeWorldId,
          previousRoute: state.worldContinuity.activeRoute,
          guidedStepId: action.worldEntrySnapshot?.guidedStep ?? state.worldContinuity.guidedStepId,
          lastAction: { label: action.reason ?? "world_context_update", at: new Date().toISOString() },
          breadcrumbs: [{ worldId: action.activeWorldId, route: action.worldEntrySnapshot?.href ?? state.lastRoute ?? "/shopreel", at: new Date().toISOString(), label: action.reason ?? "world_context_update" }, ...state.worldContinuity.breadcrumbs].slice(0, 10),
        },
      };
    default:
      return state;
  }
}

export const runtimeSessionSelectors = {
  isIdle: (state: OperatorRuntimeSessionState) => state.runtimeState === "idle",
  isInterrupted: (state: OperatorRuntimeSessionState) => Boolean(state.interruption),
  canRecover: (state: OperatorRuntimeSessionState) => Boolean(state.recoverableContext),
};

export function buildRuntimeStartAction(resolution: OperatorRuntimeResolution, command: string): StartRuntimeAction {
  return { type: "START_RUNTIME", resolution, command };
}

export function buildInterruptAction(input: {
  reason: string;
  requestedSurface: OperatorSurfaceId;
  returnSurface: OperatorSurfaceId;
  returnState: OperatorRuntimeState;
  fallbackRoute: string;
}): InterruptAction {
  return {
    type: "INTERRUPT",
    interruption: {
      reason: input.reason,
      requestedSurface: input.requestedSurface,
      returnSurface: input.returnSurface,
      returnState: input.returnState,
      at: new Date().toISOString(),
    },
    fallbackRoute: input.fallbackRoute,
  };
}
