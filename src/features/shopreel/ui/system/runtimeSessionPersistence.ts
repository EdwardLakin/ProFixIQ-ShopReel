import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { OperatorRuntimeState, OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";
import type { RuntimeWorldEntryIntent, RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

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
  chamberMemory: PersistedChamberMemory;
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
    chamberMemory: {
      lastKnownRuntimeState: session.runtimeState,
      lastKnownSurface: session.activeSurface,
      interruptionCount: (previousMemory?.interruptionCount ?? 0) + (session.interruption ? 1 : 0),
      restorationCount: (previousMemory?.restorationCount ?? 0) + (session.pendingTransition === "restore_previous" ? 1 : 0),
      traces,
    },
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
      };
    }
    return parsed;
  } catch {
    return null;
  }
}
