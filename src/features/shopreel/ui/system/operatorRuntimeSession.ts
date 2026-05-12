import type {
  OperatorRuntimeResolution,
  OperatorRuntimeState,
  OperatorSurfaceId,
  OperatorTransitionMode,
} from "@/features/shopreel/ui/system/operatorRuntime";

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
  fallbackRoute: string;
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
  fallbackRoute: "/shopreel",
};

type StartRuntimeAction = { type: "START_RUNTIME"; resolution: OperatorRuntimeResolution; command: string };
type StartTransitionAction = { type: "START_TRANSITION"; mode: OperatorTransitionMode };
type CompleteTransitionAction = { type: "COMPLETE_TRANSITION" };
type SetCompressedHeroAction = { type: "SET_COMPRESSED_HERO"; compressed: boolean };
type InterruptAction = { type: "INTERRUPT"; interruption: RuntimeInterruption; fallbackRoute: string };
type RecoverAction = { type: "RECOVER" };
type SelectEntityAction = { type: "SELECT_ENTITY"; campaignId?: string | null; generationId?: string | null };

export type OperatorRuntimeSessionAction =
  | StartRuntimeAction
  | StartTransitionAction
  | CompleteTransitionAction
  | SetCompressedHeroAction
  | InterruptAction
  | RecoverAction
  | SelectEntityAction;

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
