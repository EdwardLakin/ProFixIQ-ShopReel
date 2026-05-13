import type { RuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";
import type { RuntimeSpatialMap } from "@/features/shopreel/ui/system/runtimeSpatialMap";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeSceneVector = { x: number; y: number; z: number };

export type RuntimeTraversalMomentum = { continuity: number; directionalEnergy: number; carryoverEnergy: number };
export type RuntimeTraversalRecovery = { state: "idle" | "recovering"; stability: number };
export type RuntimeTraversalCarryover = { environmental: number; focus: number; familiarity: number };
export type RuntimeTraversalContinuity = { returnPathAffinity: number; familiarity: number };
export type RuntimeTraversalSpatialIntent = "advance" | "stabilize" | "recover";
export type RuntimeTraversalField = { momentum: RuntimeTraversalMomentum; recovery: RuntimeTraversalRecovery; carryover: RuntimeTraversalCarryover; continuity: RuntimeTraversalContinuity; intent: RuntimeTraversalSpatialIntent };
export type RuntimeTraversalTopologyField = { operationalGravity: number; continuityCorridor: number; escalationVector: number; decompressionBias: number };

export type RuntimeTraversalState = {
  continuitySnapshot?: { chamberCarryover: number; focalPersistence: number };
  sourceWorld: RuntimeWorldId | null;
  targetWorld: RuntimeWorldId;
  direction: string;
  continuityMomentum: number;
  transitionVector: RuntimeSceneVector;
  environmentalCarryover: number;
  cameraPath: "arc" | "direct" | "settle";
  arrivalFocusPlane: "foreground" | "midground" | "operator";
  returnFocusPlane: "foreground" | "midground" | "operator";
  interruptedRecovery: "idle" | "recovering";
  field: RuntimeTraversalField;
  topologyField: RuntimeTraversalTopologyField;
};

export function deriveTraversalVector(spatialMap: RuntimeSpatialMap, geometry: RuntimeChamberGeometry): RuntimeSceneVector {
  return {
    x: spatialMap.directionalShift.x * 0.8 + geometry.directionalBias.x,
    y: spatialMap.directionalShift.y * 0.7 + geometry.directionalBias.y,
    z: spatialMap.directionalShift.z * 1.2 + geometry.directionalBias.z,
  };
}

export function deriveEnvironmentalCarryover(spatialMap: RuntimeSpatialMap): number {
  return Math.min(1, Math.max(0, spatialMap.continuityMemory.continuityStrength));
}

export function deriveArrivalFocus(unresolvedCount: number): RuntimeTraversalState["arrivalFocusPlane"] {
  if (unresolvedCount > 2) return "foreground";
  if (unresolvedCount > 0) return "operator";
  return "midground";
}

export function deriveRuntimeTraversal(params: {
  sourceWorld: RuntimeWorldId | null;
  targetWorld: RuntimeWorldId;
  spatialMap: RuntimeSpatialMap;
  geometry: RuntimeChamberGeometry;
  unresolvedCount: number;
}): RuntimeTraversalState {
  const transitionVector = deriveTraversalVector(params.spatialMap, params.geometry);
  const environmentalCarryover = deriveEnvironmentalCarryover(params.spatialMap);
  const familiarity = Math.max(0, 1 - Math.min(1, Math.abs(transitionVector.x) + Math.abs(transitionVector.y)) * 0.5);
  return {
    sourceWorld: params.sourceWorld,
    targetWorld: params.targetWorld,
    direction: params.spatialMap.traversal,
    continuityMomentum: environmentalCarryover * 0.7 + Math.abs(transitionVector.z) * 0.3,
    transitionVector,
    environmentalCarryover,
    cameraPath: params.geometry.motionLanguage.axis === "orbital" ? "arc" : params.geometry.motionLanguage.easing === "settle" ? "settle" : "direct",
    arrivalFocusPlane: deriveArrivalFocus(params.unresolvedCount),
    returnFocusPlane: params.unresolvedCount > 0 ? "operator" : "midground",
    interruptedRecovery: params.unresolvedCount > 0 ? "recovering" : "idle",
    field: {
      momentum: { continuity: environmentalCarryover, directionalEnergy: Math.min(1, Math.abs(transitionVector.z)), carryoverEnergy: environmentalCarryover * 0.8 },
      recovery: { state: params.unresolvedCount > 0 ? "recovering" : "idle", stability: familiarity },
      carryover: { environmental: environmentalCarryover, focus: params.unresolvedCount > 0 ? 0.9 : 0.5, familiarity },
      continuity: { returnPathAffinity: params.unresolvedCount > 0 ? 0.8 : 0.6, familiarity },
      intent: params.unresolvedCount > 1 ? "recover" : environmentalCarryover > 0.55 ? "stabilize" : "advance",
    },
    continuitySnapshot: { chamberCarryover: environmentalCarryover, focalPersistence: params.unresolvedCount > 0 ? 0.85 : 0.55 },
    topologyField: {
      operationalGravity: Math.min(1, params.unresolvedCount / 4 + Math.abs(transitionVector.z) * 0.3),
      continuityCorridor: familiarity,
      escalationVector: Math.min(1, params.unresolvedCount / 3),
      decompressionBias: Math.max(0, 1 - Math.min(1, params.unresolvedCount / 3)),
    },
  };
}

export function deriveReturnTraversal(targetWorld: RuntimeWorldId, spatialMap: RuntimeSpatialMap, geometry: RuntimeChamberGeometry): RuntimeTraversalState {
  return deriveRuntimeTraversal({ sourceWorld: targetWorld, targetWorld, spatialMap, geometry, unresolvedCount: 0 });
}
