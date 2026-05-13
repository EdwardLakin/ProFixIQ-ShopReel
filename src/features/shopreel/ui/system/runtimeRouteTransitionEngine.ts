import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { RuntimeTraversalState } from "@/features/shopreel/ui/system/runtimeTraversalEngine";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export type RuntimeRoutePressureInterpolation = {
  continuityPressure: number;
  recoveryPressure: number;
  focusPressure: number;
};

export type RuntimeFocalPersistence = {
  focalEntityId: string | null;
  focalPlane: RuntimeTraversalState["arrivalFocusPlane"];
  persistenceWeight: number;
};

export type RuntimeRecoveryTransitionPacing = {
  pacing: "stable" | "recovering";
  recoveryWeight: number;
  continuityWeight: number;
};

export type RuntimeChamberCarryover = {
  sourceWorld: RuntimeWorldId | null;
  targetWorld: RuntimeWorldId;
  sourceMomentum: number;
  targetMomentum: number;
  carryoverWeight: number;
};

export type RuntimeRouteContinuitySnapshot = {
  sourceWorld: RuntimeWorldId | null;
  targetWorld: RuntimeWorldId;
  directionalContinuity: number;
  pressureInterpolation: RuntimeRoutePressureInterpolation;
  focalPersistence: RuntimeFocalPersistence;
  recoveryPacing: RuntimeRecoveryTransitionPacing;
  chamberCarryover: RuntimeChamberCarryover;
};

export type RuntimeRouteTraversalMemory = {
  previousWorldId: RuntimeWorldId | null;
  previousContinuityMomentum: number;
  previousContinuityPressure: number;
  previousFocalEntityId: string | null;
};

export type RuntimeRouteTransitionEngine = {
  memory: RuntimeRouteTraversalMemory;
  continuity: RuntimeRouteContinuitySnapshot;
};

export function deriveRuntimeRouteTransitionEngine(input: {
  sourceWorld: RuntimeWorldId | null;
  targetWorld: RuntimeWorldId;
  traversal: RuntimeTraversalState;
  unresolvedCount: number;
  continuityPressure: number;
  previousMemory: RuntimeRouteTraversalMemory | null;
  focalEntityId: string | null;
}): RuntimeRouteTransitionEngine {
  const unresolvedWeight = clamp(input.unresolvedCount / 5);
  const continuityPressure = clamp(
    input.traversal.continuityMomentum * 0.45 +
      input.continuityPressure * 0.4 +
      unresolvedWeight * 0.15,
  );
  const recoveryPressure = clamp(unresolvedWeight * 0.65 + (1 - input.traversal.field.recovery.stability) * 0.35);
  const focusPressure = clamp(input.traversal.field.carryover.focus * 0.6 + input.traversal.topologyField.operationalGravity * 0.4);
  const directionalContinuity = clamp((input.traversal.environmentalCarryover + input.traversal.field.continuity.familiarity) / 2);
  const previousMomentum = input.previousMemory?.previousContinuityMomentum ?? directionalContinuity;
  const targetMomentum = clamp(previousMomentum * 0.55 + directionalContinuity * 0.45);
  const focalEntityId = input.focalEntityId ?? input.previousMemory?.previousFocalEntityId ?? null;
  const focalPlane = input.traversal.arrivalFocusPlane;
  const persistenceWeight = clamp((focalEntityId ? 0.6 : 0.25) + directionalContinuity * 0.4);

  return {
    memory: {
      previousWorldId: input.targetWorld,
      previousContinuityMomentum: targetMomentum,
      previousContinuityPressure: continuityPressure,
      previousFocalEntityId: focalEntityId,
    },
    continuity: {
      sourceWorld: input.sourceWorld,
      targetWorld: input.targetWorld,
      directionalContinuity,
      pressureInterpolation: { continuityPressure, recoveryPressure, focusPressure },
      focalPersistence: { focalEntityId, focalPlane, persistenceWeight },
      recoveryPacing: {
        pacing: recoveryPressure > 0.55 ? "recovering" : "stable",
        recoveryWeight: recoveryPressure,
        continuityWeight: continuityPressure,
      },
      chamberCarryover: {
        sourceWorld: input.sourceWorld,
        targetWorld: input.targetWorld,
        sourceMomentum: previousMomentum,
        targetMomentum,
        carryoverWeight: clamp(targetMomentum * 0.7 + directionalContinuity * 0.3),
      },
    },
  };
}
