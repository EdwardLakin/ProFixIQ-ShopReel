import type { RuntimeEnvironmentalIntelligence } from "@/features/shopreel/ui/system/runtimeEnvironmentalIntelligence";
import type { RuntimeEntityMaterialization } from "@/features/shopreel/ui/system/runtimeEntitySpace";
import type { RuntimeSceneComposition } from "@/features/shopreel/ui/system/runtimeSceneGraph";
import type { RuntimeTraversalState } from "@/features/shopreel/ui/system/runtimeTraversalEngine";
import type { RuntimeWorldState } from "@/features/shopreel/ui/system/runtimeWorldState";
import type { RuntimeWorldContinuity } from "@/features/shopreel/ui/system/runtimeWorldContinuity";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export type RuntimeGravityWell = { intensity: number; focalPlane: "foreground" | "midground" | "operator"; anchorNodeId: string };
export type RuntimeContinuityCorridor = { strength: number; fromNodeId: string; toNodeId: string };
export type RuntimeDecompressionRegion = { availability: number; preferredPlane: "peripheral" | "background" };
export type RuntimeEscalationVector = { magnitude: number; x: number; y: number; z: number };
export type RuntimeOperatorStabilizationZone = { stability: number; proximityWeight: number; chamberAnchor: "east" | "west" | "center" };
export type RuntimeTopologyInteractionZone = { id: string; type: "focal" | "support" | "recessed"; weight: number; nodeId: string };

export type RuntimeTopologyField = {
  gravityWell: RuntimeGravityWell;
  continuityCorridor: RuntimeContinuityCorridor;
  decompressionRegion: RuntimeDecompressionRegion;
  escalationVector: RuntimeEscalationVector;
  operatorZone: RuntimeOperatorStabilizationZone;
  interactionZones: RuntimeTopologyInteractionZone[];
};

export function deriveRuntimeTopologyField(input: {
  worldState: RuntimeWorldState;
  continuity: RuntimeWorldContinuity;
  entityMaterialization: RuntimeEntityMaterialization;
  traversal: RuntimeTraversalState;
  environmentalIntelligence: RuntimeEnvironmentalIntelligence;
  scene: RuntimeSceneComposition;
}): RuntimeTopologyField {
  const focalPlane = input.traversal.arrivalFocusPlane;
  const focalNodeId = focalPlane === "operator" ? "operator" : focalPlane;
  const gravityIntensity = clamp(
    input.entityMaterialization.actionSurfaceGravity * 0.5 +
      input.traversal.topologyField.operationalGravity * 0.3 +
      input.continuity.unresolvedPressure * 0.2,
  );
  const corridorStrength = clamp(
    input.continuity.continuityCorridorStrength * 0.55 +
      input.traversal.topologyField.continuityCorridor * 0.45,
  );
  const decompressionAvailability = clamp(
    (1 - input.continuity.unresolvedPressure) * 0.6 +
      input.traversal.topologyField.decompressionBias * 0.4,
  );
  const escalationMagnitude = clamp(
    input.environmentalIntelligence.urgencyPressure * 0.5 +
      input.entityMaterialization.relationshipTension * 0.3 +
      input.worldState.pressure.workflowPressure * 0.2,
  );

  const zones: RuntimeTopologyInteractionZone[] = input.scene.nodes
    .filter((node) => node.plane === "foreground" || node.plane === "midground" || node.plane === "operator" || node.plane === "peripheral")
    .map((node) => {
      const weighted = clamp(node.focusPriority * 0.45 + node.focalGravity * 0.3 + node.continuityWeight * 0.25);
      const type: RuntimeTopologyInteractionZone["type"] = node.id === focalNodeId ? "focal" : weighted > 0.66 ? "support" : "recessed";
      return { id: `${node.id}-zone`, type, weight: weighted, nodeId: node.id };
    });

  return {
    gravityWell: { intensity: gravityIntensity, focalPlane, anchorNodeId: focalNodeId },
    continuityCorridor: { strength: corridorStrength, fromNodeId: input.traversal.sourceWorld ? "peripheral" : "background", toNodeId: focalNodeId },
    decompressionRegion: { availability: decompressionAvailability, preferredPlane: decompressionAvailability > 0.5 ? "peripheral" : "background" },
    escalationVector: { magnitude: escalationMagnitude, x: input.traversal.transitionVector.x, y: input.traversal.transitionVector.y, z: input.traversal.transitionVector.z },
    operatorZone: { stability: clamp(1 - escalationMagnitude * 0.6), proximityWeight: clamp(corridorStrength * 0.65 + decompressionAvailability * 0.35), chamberAnchor: focalPlane === "operator" ? "center" : "east" },
    interactionZones: zones,
  };
}
