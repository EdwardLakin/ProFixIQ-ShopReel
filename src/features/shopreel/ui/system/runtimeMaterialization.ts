import type { RuntimeFieldSystem } from "@/features/shopreel/ui/system/runtimeFieldSystem";
import type { RuntimeWorldState } from "@/features/shopreel/ui/system/runtimeWorldState";
import type { RuntimeWorldContinuity } from "@/features/shopreel/ui/system/runtimeWorldContinuity";
import type { RuntimeTraversalState } from "@/features/shopreel/ui/system/runtimeTraversalEngine";
import type { RuntimeOperatorContinuityState } from "@/features/shopreel/ui/system/runtimeOperatorState";

export type RuntimeMaterialization = {
  environmentalInfluence: number;
  chamberTension: number;
  focalEmergence: number;
  spatialEmphasis: number;
  continuityPressure: number;
  traversalSoftness: number;
  environmentalStabilization: number;
  chamberDensity: number;
  actionProminence: number;
  operationalDrift: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function deriveRuntimeMaterialization(input: {
  worldState: RuntimeWorldState;
  worldContinuity: RuntimeWorldContinuity;
  fieldSystem: RuntimeFieldSystem;
  traversal: RuntimeTraversalState;
  unresolvedBlockers: number;
  operatorState: RuntimeOperatorContinuityState;
}): RuntimeMaterialization {
  const continuityPressure = clamp(input.fieldSystem.urgencyField * 0.5 + (1 - input.fieldSystem.continuityField) * 0.5);
  const chamberTension = clamp(input.worldState.pressure.chamberDensity * 0.6 + continuityPressure * 0.4);
  const environmentalStabilization = clamp(input.fieldSystem.continuityField * 0.45 + (1 - input.fieldSystem.interruptionField) * 0.35 + (input.operatorState === "recovery" ? 0.08 : 0.2));
  const traversalSoftness = clamp(input.traversal.topologyField.decompressionBias * 0.5 + input.traversal.field.carryover.familiarity * 0.3 + environmentalStabilization * 0.2);
  return {
    environmentalInfluence: clamp(chamberTension * 0.55 + input.traversal.environmentalCarryover * 0.45),
    chamberTension,
    focalEmergence: clamp(chamberTension * 0.55 + input.fieldSystem.attentionField * 0.45),
    spatialEmphasis: clamp(Math.abs(input.traversal.transitionVector.z) * 0.6 + continuityPressure * 0.4),
    continuityPressure,
    traversalSoftness,
    environmentalStabilization,
    chamberDensity: clamp(input.worldState.pressure.chamberDensity * 0.7 + input.fieldSystem.orchestrationDensityField * 0.3),
    actionProminence: clamp(continuityPressure * 0.5 + Math.min(1, input.unresolvedBlockers / 4) * 0.5),
    operationalDrift: clamp((1 - input.worldContinuity.operationalRhythm) * 0.55 + input.fieldSystem.interruptionField * 0.45),
  };
}
