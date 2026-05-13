import type { RuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";
import type { RuntimeSpatialMap } from "@/features/shopreel/ui/system/runtimeSpatialMap";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeSceneVector = { x: number; y: number; z: number };

export type RuntimeTraversalState = {
  sourceWorld: RuntimeWorldId | null;
  targetWorld: RuntimeWorldId;
  direction: string;
  continuityMomentum: number;
  transitionVector: RuntimeSceneVector;
  environmentalCarryover: number;
  cameraPath: "arc" | "direct" | "settle";
  arrivalFocusPlane: "foreground" | "midground" | "operator";
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
  return {
    sourceWorld: params.sourceWorld,
    targetWorld: params.targetWorld,
    direction: params.spatialMap.traversal,
    continuityMomentum: environmentalCarryover * 0.7 + Math.abs(transitionVector.z) * 0.3,
    transitionVector,
    environmentalCarryover,
    cameraPath: params.geometry.motionLanguage.axis === "orbital" ? "arc" : params.geometry.motionLanguage.easing === "settle" ? "settle" : "direct",
    arrivalFocusPlane: deriveArrivalFocus(params.unresolvedCount),
  };
}

export function deriveReturnTraversal(targetWorld: RuntimeWorldId, spatialMap: RuntimeSpatialMap, geometry: RuntimeChamberGeometry): RuntimeTraversalState {
  return deriveRuntimeTraversal({ sourceWorld: targetWorld, targetWorld, spatialMap, geometry, unresolvedCount: 0 });
}
