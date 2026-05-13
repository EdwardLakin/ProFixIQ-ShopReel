import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeWorldContinuity = {
  worldId: RuntimeWorldId;
  continuityMomentum: number;
  traversalFamiliarity: number;
  attentionHistory: number;
  unresolvedPressure: number;
  operationalRhythm: number;
  continuityCorridorStrength: number;
  navigationMomentum: number;
};

export type RuntimeWorldRecoveryState = "stable" | "recovering" | "decompressing";

export function deriveRuntimeWorldContinuity(input: {
  worldId: RuntimeWorldId;
  unresolvedCount: number;
  continuityStrength: number;
  familiarity: number;
  previousMomentum: number;
  attentionCarryover: number;
}): RuntimeWorldContinuity {
  const unresolvedPressure = Math.min(1, input.unresolvedCount / 5);
  const continuityMomentum = Math.min(1, input.previousMomentum * 0.56 + input.continuityStrength * 0.44);
  const operationalRhythm = Math.min(1, continuityMomentum * 0.65 + (1 - unresolvedPressure) * 0.35);
  return {
    worldId: input.worldId,
    continuityMomentum,
    traversalFamiliarity: input.familiarity,
    attentionHistory: input.attentionCarryover,
    unresolvedPressure,
    operationalRhythm,
    continuityCorridorStrength: Math.min(1, (input.continuityStrength + input.familiarity) / 2),
    navigationMomentum: Math.min(1, continuityMomentum * 0.7 + input.familiarity * 0.3),
  };
}

export function deriveWorldRecoveryState(pressure: number, rhythm: number): RuntimeWorldRecoveryState {
  if (pressure > 0.65) return "recovering";
  if (pressure > 0.4 && rhythm < 0.55) return "decompressing";
  return "stable";
}
