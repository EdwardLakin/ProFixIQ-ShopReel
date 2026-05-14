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

export type RuntimeSpatialMovementSemantic = "moving_deeper" | "widening_context" | "entering_execution" | "resurfacing" | "descending_systems" | "lateral_world_transfer";

export type RuntimeRouteContinuitySnapshot = {
  sourceWorld: RuntimeWorldId | null;
  targetWorld: RuntimeWorldId;
  directionalContinuity: number;
  pressureInterpolation: RuntimeRoutePressureInterpolation;
  focalPersistence: RuntimeFocalPersistence;
  recoveryPacing: RuntimeRecoveryTransitionPacing;
  chamberCarryover: RuntimeChamberCarryover;
  movementSemantic: RuntimeSpatialMovementSemantic;
  cameraSemantics: { focalDepthLayer: number; environmentalParallax: number; foregroundAttenuation: number; distantChamberHaze: number; topologyScaling: number; motionWeightedContinuity: number; interpolationBias: number };
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
  const movementSemantic: RuntimeSpatialMovementSemantic = input.sourceWorld === null ? "resurfacing" : input.unresolvedCount > 2 ? "descending_systems" : directionalContinuity > 0.72 ? "moving_deeper" : focusPressure > 0.62 ? "entering_execution" : recoveryPressure > 0.6 ? "resurfacing" : input.sourceWorld === input.targetWorld ? "widening_context" : "lateral_world_transfer";
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
      movementSemantic,
      cameraSemantics: { focalDepthLayer: clamp(input.traversal.field.carryover.focus * 0.6 + (input.traversal.field.intent === "advance" ? 0.45 : input.traversal.field.intent === "stabilize" ? 0.62 : 0.84) * 0.4), environmentalParallax: clamp(input.traversal.transitionVector.z * 0.5 + directionalContinuity * 0.5), foregroundAttenuation: clamp(1 - recoveryPressure * 0.35), distantChamberHaze: clamp((1 - directionalContinuity) * 0.6 + recoveryPressure * 0.4), topologyScaling: clamp(input.traversal.topologyField.operationalGravity * 0.5 + continuityPressure * 0.5), motionWeightedContinuity: clamp(targetMomentum * 0.7 + Math.min(1, Math.abs(input.traversal.transitionVector.z) + Math.abs(input.traversal.transitionVector.x) * 0.3) * 0.3), interpolationBias: clamp(Math.min(1, Math.abs(input.traversal.transitionVector.z) + Math.abs(input.traversal.transitionVector.x) * 0.3) * 0.55 + focusPressure * 0.45) },
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
