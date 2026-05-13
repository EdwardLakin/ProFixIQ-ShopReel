import type { RuntimeEmbodiedState } from "@/features/shopreel/ui/system/runtimeEmbodiment";
import type { RuntimeEntityMaterialization } from "@/features/shopreel/ui/system/runtimeEntitySpace";
import type { deriveRuntimeOperatorState } from "@/features/shopreel/ui/system/runtimeOperatorState";
import type { RuntimeTopologyField } from "@/features/shopreel/ui/system/runtimeTopologyField";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export type RuntimeOperatorAtmosphere = { density: number; signal: "calm" | "guided" | "urgent" };
export type RuntimeOperatorContinuityPresence = { persistence: number; continuityPressure: number; stabilizing: boolean };
export type RuntimeOperatorGuidanceField = { emphasis: number; anchor: "operator" | "midground"; cue: string };
export type RuntimeOperatorEnvironmentalSignal = { urgency: number; decompressionAllowance: number; confidence: number };
export type RuntimePresenceStabilization = { rhythm: number; driftResistance: number };
export type RuntimePresenceLayer = {
  atmosphere: RuntimeOperatorAtmosphere;
  continuityPresence: RuntimeOperatorContinuityPresence;
  guidanceField: RuntimeOperatorGuidanceField;
  environmentalSignal: RuntimeOperatorEnvironmentalSignal;
  stabilization: RuntimePresenceStabilization;
};

export function deriveRuntimePresenceLayer(input: {
  operatorState: ReturnType<typeof deriveRuntimeOperatorState>;
  embodiedState: RuntimeEmbodiedState;
  materialization: RuntimeEntityMaterialization;
  continuityPressure: number;
  topologyField: RuntimeTopologyField;
}): RuntimePresenceLayer {
  const urgency = clamp(input.operatorState.presenceField.recoveryBias * 0.5 + input.continuityPressure * 0.5);
  const rhythmBase = input.embodiedState.operationalRhythm === "active" ? 0.72 : input.embodiedState.operationalRhythm === "steady" ? 0.55 : 0.32;
  return {
    atmosphere: {
      density: clamp(input.embodiedState.chamberDensity * 0.4 + input.materialization.entityClusterWeight * 0.3 + input.topologyField.operatorZone.proximityWeight * 0.3),
      signal: urgency > 0.7 ? "urgent" : urgency > 0.45 ? "guided" : "calm",
    },
    continuityPresence: {
      persistence: clamp(input.topologyField.continuityCorridor.strength * 0.7 + input.operatorState.presenceField.stabilization * 0.3),
      continuityPressure: input.continuityPressure,
      stabilizing: input.topologyField.operatorZone.stability > 0.45,
    },
    guidanceField: {
      emphasis: clamp(input.operatorState.presenceField.continuityGuidance * 0.6 + input.topologyField.gravityWell.intensity * 0.4),
      anchor: input.topologyField.gravityWell.focalPlane === "operator" ? "operator" : "midground",
      cue: input.operatorState.continuityState,
    },
    environmentalSignal: {
      urgency,
      decompressionAllowance: input.topologyField.decompressionRegion.availability,
      confidence: clamp(input.operatorState.presenceField.stabilization * 0.7 + (1 - urgency) * 0.3),
    },
    stabilization: {
      rhythm: clamp(rhythmBase * 0.65 + input.topologyField.continuityCorridor.strength * 0.35),
      driftResistance: clamp((1 - input.embodiedState.operationalDrift) * 0.6 + input.topologyField.operatorZone.stability * 0.4),
    },
  };
}
