import type { RuntimeMaterialization } from "@/features/shopreel/ui/system/runtimeMaterialization";

export type RuntimeChamberMood = "stabilizing" | "pressured" | "fragmented" | "recovering";
export type RuntimeOperationalRhythm = "steady" | "active" | "stalled";
export type RuntimePressureResolution = "contained" | "elevated" | "critical";
export type RuntimeRecoveryTrajectory = "stable" | "decompressing" | "restoring";

export type RuntimeOperationalConvergence = {
  chamberMood: RuntimeChamberMood;
  operationalRhythm: RuntimeOperationalRhythm;
  pressureResolution: RuntimePressureResolution;
  recoveryTrajectory: RuntimeRecoveryTrajectory;
  fragmentation: number;
  workloadDensity: number;
};

export type RuntimeEmbodiedState = RuntimeMaterialization & RuntimeOperationalConvergence;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function deriveRuntimeEmbodiedState(materialization: RuntimeMaterialization): RuntimeEmbodiedState {
  const fragmentation = clamp(materialization.operationalDrift * 0.65 + materialization.continuityPressure * 0.35);
  const workloadDensity = clamp(materialization.chamberDensity * 0.58 + materialization.chamberTension * 0.42);
  const chamberMood: RuntimeChamberMood = fragmentation > 0.72 ? "fragmented" : materialization.environmentalStabilization > 0.62 ? "stabilizing" : materialization.continuityPressure > 0.6 ? "pressured" : "recovering";
  const operationalRhythm: RuntimeOperationalRhythm = materialization.operationalDrift > 0.66 ? "stalled" : materialization.spatialEmphasis > 0.52 ? "active" : "steady";
  const pressureResolution: RuntimePressureResolution = materialization.continuityPressure > 0.75 ? "critical" : materialization.continuityPressure > 0.5 ? "elevated" : "contained";
  const recoveryTrajectory: RuntimeRecoveryTrajectory = materialization.environmentalStabilization > 0.7 ? "stable" : materialization.traversalSoftness > 0.55 ? "decompressing" : "restoring";
  return { ...materialization, chamberMood, operationalRhythm, pressureResolution, recoveryTrajectory, fragmentation, workloadDensity };
}
