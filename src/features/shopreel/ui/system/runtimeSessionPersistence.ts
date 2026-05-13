import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { OperatorRuntimeState, OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";
import type { RuntimeWorldEntryIntent, RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { GuidedFlowStepId } from "@/features/shopreel/ui/system/guidedWorldFlow";

export const RUNTIME_SESSION_KEY = "shopreel-operator-runtime-session-v1";

export type PersistedChamberMemoryTrace = {
  runtimeState: OperatorRuntimeState;
  surface: OperatorSurfaceId;
  interruptionReason: string | null;
  timestamp: string;
};

export type PersistedChamberMemory = {
  lastKnownRuntimeState: OperatorRuntimeState;
  lastKnownSurface: OperatorSurfaceId;
  interruptionCount: number;
  restorationCount: number;
  traces: PersistedChamberMemoryTrace[];
};

export type PersistedRuntimeSession = {
  activeCampaignId: string | null;
  activeSurface: OperatorSurfaceId;
  previousSurface: OperatorSurfaceId | null;
  progressionStage: OperatorRuntimeState;
  interruptionReason: string | null;
  returnTarget: string;
  updatedAt: string;
  activeWorldId: RuntimeWorldId | null;
  previousWorldId: RuntimeWorldId | null;
  worldEntryIntent: RuntimeWorldEntryIntent | null;
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
  chamberMemory: PersistedChamberMemory;
  worldContinuity: OperatorRuntimeSessionState["worldContinuity"];
};

const MAX_MEMORY_TRACES = 6;

export function persistRuntimeSession(session: OperatorRuntimeSessionState): void {
  if (typeof window === "undefined") return;
  const previous = readPersistedRuntimeSession();
  const previousMemory = previous?.chamberMemory;
  const nextTrace: PersistedChamberMemoryTrace = {
    runtimeState: session.runtimeState,
    surface: session.activeSurface,
    interruptionReason: session.interruption?.reason ?? null,
    timestamp: new Date().toISOString(),
  };
  const traces = [nextTrace, ...(previousMemory?.traces ?? [])]
    .filter((trace, index, arr) => arr.findIndex((candidate) => candidate.runtimeState === trace.runtimeState && candidate.surface === trace.surface && candidate.interruptionReason === trace.interruptionReason) === index)
    .slice(0, MAX_MEMORY_TRACES);

  const payload: PersistedRuntimeSession = {
    activeCampaignId: session.selectedEntityIds.campaignId,
    activeSurface: session.activeSurface,
    previousSurface: session.previousSurface,
    progressionStage: session.runtimeState,
    interruptionReason: session.interruption?.reason ?? null,
    returnTarget: session.fallbackRoute,
    updatedAt: new Date().toISOString(),
    activeWorldId: session.activeWorldId,
    previousWorldId: session.previousWorldId,
    worldEntryIntent: session.worldEntryIntent,
    worldRecommendation: session.worldRecommendation,
    worldEntrySnapshot: session.worldEntrySnapshot,
    chamberMemory: {
      lastKnownRuntimeState: session.runtimeState,
      lastKnownSurface: session.activeSurface,
      interruptionCount: (previousMemory?.interruptionCount ?? 0) + (session.interruption ? 1 : 0),
      restorationCount: (previousMemory?.restorationCount ?? 0) + (session.pendingTransition === "restore_previous" ? 1 : 0),
      traces,
    },
    worldContinuity: session.worldContinuity,
  };
  window.localStorage.setItem(RUNTIME_SESSION_KEY, JSON.stringify(payload));
}

export function readPersistedRuntimeSession(): PersistedRuntimeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RUNTIME_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedRuntimeSession;
    if (!parsed.chamberMemory) {
      return {
        ...parsed,
        chamberMemory: {
          lastKnownRuntimeState: parsed.progressionStage,
          lastKnownSurface: parsed.activeSurface,
          interruptionCount: parsed.interruptionReason ? 1 : 0,
          restorationCount: 0,
          traces: [{
            runtimeState: parsed.progressionStage,
            surface: parsed.activeSurface,
            interruptionReason: parsed.interruptionReason,
            timestamp: parsed.updatedAt,
          }],
        },
        worldContinuity: parsed.worldContinuity ?? {
          activeWorldId: parsed.activeWorldId,
          activeWorldKind: null,
          activeEntityId: parsed.worldEntrySnapshot?.entityId ?? null,
          activeRoute: parsed.worldEntrySnapshot?.href ?? null,
          previousWorldId: parsed.previousWorldId,
          previousRoute: null,
          guidedStepId: parsed.worldEntrySnapshot?.guidedStep ?? null,
          panelMode: "operator",
          environment: {
            visualSeed: parsed.worldEntrySnapshot?.visualSeed ?? "operations:default",
            backgroundTone: "slate",
            returnToDeckHref: "/shopreel",
          },
          lastAction: null,
          breadcrumbs: [],
        },
      };
    }
    if (!parsed.worldContinuity) {
      parsed.worldContinuity = {
        activeWorldId: parsed.activeWorldId,
        activeWorldKind: null,
        activeEntityId: parsed.worldEntrySnapshot?.entityId ?? null,
        activeRoute: parsed.worldEntrySnapshot?.href ?? null,
        previousWorldId: parsed.previousWorldId,
        previousRoute: null,
        guidedStepId: parsed.worldEntrySnapshot?.guidedStep ?? null,
        panelMode: "operator",
        environment: { visualSeed: parsed.worldEntrySnapshot?.visualSeed ?? "operations:default", backgroundTone: "slate", returnToDeckHref: "/shopreel" },
        lastAction: null,
        breadcrumbs: [],
      };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistWorldEntrySnapshot(snapshot: NonNullable<PersistedRuntimeSession["worldEntrySnapshot"]>): void {
  if (typeof window === "undefined") return;
  const existing = readPersistedRuntimeSession();
  if (!existing) return;
  window.localStorage.setItem(RUNTIME_SESSION_KEY, JSON.stringify({ ...existing, worldEntrySnapshot: snapshot, updatedAt: new Date().toISOString() }));
}
