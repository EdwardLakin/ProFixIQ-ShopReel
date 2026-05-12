import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { OperatorRuntimeState, OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";

export const RUNTIME_SESSION_KEY = "shopreel-operator-runtime-session-v1";

export type PersistedRuntimeSession = {
  activeCampaignId: string | null;
  activeSurface: OperatorSurfaceId;
  previousSurface: OperatorSurfaceId | null;
  progressionStage: OperatorRuntimeState;
  interruptionReason: string | null;
  returnTarget: string;
  updatedAt: string;
};

export function persistRuntimeSession(session: OperatorRuntimeSessionState): void {
  if (typeof window === "undefined") return;
  const payload: PersistedRuntimeSession = {
    activeCampaignId: session.selectedEntityIds.campaignId,
    activeSurface: session.activeSurface,
    previousSurface: session.previousSurface,
    progressionStage: session.runtimeState,
    interruptionReason: session.interruption?.reason ?? null,
    returnTarget: session.fallbackRoute,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(RUNTIME_SESSION_KEY, JSON.stringify(payload));
}

export function readPersistedRuntimeSession(): PersistedRuntimeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(RUNTIME_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedRuntimeSession;
  } catch {
    return null;
  }
}
