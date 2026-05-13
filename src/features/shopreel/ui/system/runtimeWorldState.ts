import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { deriveWorldRecoveryState, type RuntimeWorldContinuity } from "@/features/shopreel/ui/system/runtimeWorldContinuity";

export type RuntimeWorldPersistence = { persistedAt: string; source: "runtime_session" | "live_state"; confidence: "known" | "unknown" };
export type RuntimeWorldMemory = { spatialMemory: number; environmentalResidue: number; attentionHistory: number; traversalFamiliarity: number };
export type RuntimeWorldPressure = { unresolvedPressure: number; workflowPressure: number; chamberDensity: number };
export type RuntimeWorldTemporalField = { rhythm: number; continuityMomentum: number; ageMs: number };
export type RuntimeWorldState = {
  worldId: RuntimeWorldId;
  continuity: RuntimeWorldContinuity;
  persistence: RuntimeWorldPersistence;
  memory: RuntimeWorldMemory;
  pressure: RuntimeWorldPressure;
  temporal: RuntimeWorldTemporalField;
  recovery: ReturnType<typeof deriveWorldRecoveryState>;
};

export function deriveRuntimeWorldState(input: {
  nowIso: string;
  worldId: RuntimeWorldId;
  continuity: RuntimeWorldContinuity;
  unresolvedCount: number;
  workloadWeight: number;
  persistedAt?: string | null;
}): RuntimeWorldState {
  const ageMs = input.persistedAt ? Math.max(0, Date.parse(input.nowIso) - Date.parse(input.persistedAt)) : 0;
  const unresolvedPressure = Math.min(1, input.unresolvedCount / 5);
  const workflowPressure = Math.min(1, input.workloadWeight);
  const chamberDensity = Math.min(1, unresolvedPressure * 0.58 + workflowPressure * 0.42);
  const memory: RuntimeWorldMemory = {
    spatialMemory: input.continuity.continuityCorridorStrength,
    environmentalResidue: input.continuity.continuityMomentum,
    attentionHistory: input.continuity.attentionHistory,
    traversalFamiliarity: input.continuity.traversalFamiliarity,
  };
  return {
    worldId: input.worldId,
    continuity: input.continuity,
    persistence: { persistedAt: input.nowIso, source: input.persistedAt ? "runtime_session" : "live_state", confidence: "known" },
    memory,
    pressure: { unresolvedPressure, workflowPressure, chamberDensity },
    temporal: { rhythm: input.continuity.operationalRhythm, continuityMomentum: input.continuity.continuityMomentum, ageMs },
    recovery: deriveWorldRecoveryState(chamberDensity, input.continuity.operationalRhythm),
  };
}
