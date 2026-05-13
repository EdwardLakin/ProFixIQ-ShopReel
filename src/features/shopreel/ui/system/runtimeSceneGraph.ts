import type { ReactNode } from "react";
import type { RuntimeEnvironment } from "@/features/shopreel/ui/system/runtimeEnvironment";
import type { RuntimeSpatialMap } from "@/features/shopreel/ui/system/runtimeSpatialMap";
import type { RuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";
import type { RuntimeTraversalState } from "@/features/shopreel/ui/system/runtimeTraversalEngine";
import type { RuntimeEmbodiedState } from "@/features/shopreel/ui/system/runtimeEmbodiment";
import type { RuntimeEntityMaterialization } from "@/features/shopreel/ui/system/runtimeEntitySpace";

export type RuntimeScenePlane = "foreground" | "midground" | "background" | "peripheral" | "operator" | "atmosphere";
export type RuntimeSceneDepth = number;
export type RuntimeSceneAnchor = "north" | "south" | "east" | "west" | "center" | "north-east" | "north-west" | "south-east" | "south-west";
export type RuntimeSceneVector = { x: number; y: number; z: number };

export type RuntimeSceneNode = {
  id: string;
  plane: RuntimeScenePlane;
  depth: RuntimeSceneDepth;
  anchor: RuntimeSceneAnchor;
  vector: RuntimeSceneVector;
  scale: number;
  opacity: number;
  blur: number;
  focusPriority: number;
  pointerEvents: "auto" | "none";
  content: ReactNode;
  embodiedWeight: number;
  pressureWeight: number;
  continuityWeight: number;
  recoveryWeight: number;
  entityDensity: number;
  focalGravity: number;
  attenuation: number;
  chamberPresence: number;
  metadata?: { operatorGuidance?: string };
};

export type RuntimeSceneRenderState = { chamber: RuntimeChamberGeometry; traversal: RuntimeTraversalState; reducedMotion: boolean };
export type RuntimeSceneTraversalState = RuntimeTraversalState;
export type RuntimeSceneComposition = { nodes: RuntimeSceneNode[]; state: RuntimeSceneRenderState };

export function buildRuntimeSceneComposition(params: {
  topologyDriftWeight?: number;
  chamber: RuntimeChamberGeometry;
  traversal: RuntimeTraversalState;
  environment: RuntimeEnvironment;
  spatialMap: RuntimeSpatialMap;
  reducedMotion: boolean;
  embodied: RuntimeEmbodiedState;
  entityMaterialization: RuntimeEntityMaterialization;
  foreground: ReactNode;
  midground: ReactNode;
  background: ReactNode;
  peripheral: ReactNode;
  operator: ReactNode;
  atmosphere: ReactNode;
}): RuntimeSceneComposition {
  const shift = params.traversal.transitionVector;
  const pressure = params.embodied.continuityPressure;
  const recovery = params.embodied.recoveryTrajectory === "stable" ? 0.3 : params.embodied.recoveryTrajectory === "decompressing" ? 0.55 : 0.75;
  const continuity = params.embodied.environmentalStabilization;
  const chamberPresence = Math.min(1, params.embodied.chamberDensity * 0.6 + params.embodied.environmentalInfluence * 0.4);
  const driftWeight = params.topologyDriftWeight ?? 0;
  const nodes: RuntimeSceneNode[] = [
    { id: "atmosphere", plane: "atmosphere", depth: params.chamber.depthProfile.atmosphere, anchor: "center", vector: { x: 0, y: 0, z: -0.2 }, scale: 1.06, opacity: 0.9, blur: 0, focusPriority: 0.1, pointerEvents: "none", content: params.atmosphere, embodiedWeight: 0.45, pressureWeight: pressure * 0.55, continuityWeight: continuity * 0.65, recoveryWeight: recovery * 0.5, entityDensity: params.entityMaterialization.entityClusterWeight * 0.5, focalGravity: params.entityMaterialization.actionSurfaceGravity * 0.45, attenuation: 0.82, chamberPresence },
    { id: "background", plane: "background", depth: params.chamber.depthProfile.background, anchor: "center", vector: { x: shift.x * 0.2, y: shift.y * 0.2, z: -0.1 }, scale: 1.01, opacity: 0.76, blur: 0.2, focusPriority: 0.2, pointerEvents: "none", content: params.background, embodiedWeight: 0.55, pressureWeight: pressure * 0.7, continuityWeight: continuity * 0.7, recoveryWeight: recovery * 0.6, entityDensity: params.entityMaterialization.entityClusterWeight * 0.7, focalGravity: params.entityMaterialization.actionSurfaceGravity * 0.5, attenuation: 0.72, chamberPresence },
    { id: "peripheral", plane: "peripheral", depth: params.chamber.depthProfile.peripheral, anchor: "east", vector: { x: shift.x * 0.3, y: 0, z: -0.08 }, scale: 0.98, opacity: 0.86, blur: 0.1, focusPriority: 0.3, pointerEvents: "auto", content: params.peripheral, embodiedWeight: 0.7, pressureWeight: pressure * 0.82, continuityWeight: continuity * 0.72, recoveryWeight: recovery * 0.72, entityDensity: params.entityMaterialization.entityClusterWeight * 0.9, focalGravity: params.entityMaterialization.actionSurfaceGravity * 0.68, attenuation: 0.68, chamberPresence },
    { id: "midground", plane: "midground", depth: params.chamber.depthProfile.midground, anchor: params.chamber.anchorMap.manual === "west" ? "west" : params.chamber.anchorMap.manual === "east" ? "east" : "center", vector: { x: shift.x * (0.5 + driftWeight * 0.1), y: shift.y * 0.35, z: shift.z * 0.45 }, scale: 1, opacity: 1, blur: 0, focusPriority: params.traversal.arrivalFocusPlane === "midground" ? 1 : 0.7, pointerEvents: "auto", content: params.midground, embodiedWeight: 0.88, pressureWeight: pressure * 0.92, continuityWeight: continuity * 0.85, recoveryWeight: recovery * 0.8, entityDensity: params.entityMaterialization.entityClusterWeight, focalGravity: params.entityMaterialization.actionSurfaceGravity * 0.88, attenuation: 0.82, chamberPresence },
    { id: "operator", plane: "operator", depth: params.chamber.depthProfile.foreground, anchor: params.chamber.anchorMap.operator, vector: { x: shift.x * 0.42, y: shift.y * 0.5, z: shift.z * 0.55 }, scale: 0.96, opacity: 0.96, blur: 0, focusPriority: params.traversal.arrivalFocusPlane === "operator" ? 0.98 : 0.72, pointerEvents: "auto", content: params.operator, embodiedWeight: 0.86, pressureWeight: pressure * 0.86, continuityWeight: continuity * 0.84, recoveryWeight: recovery * 0.85, entityDensity: params.entityMaterialization.entityPressure, focalGravity: params.entityMaterialization.actionSurfaceGravity, attenuation: 0.86, chamberPresence, metadata: { operatorGuidance: params.embodied.chamberMood } },
    { id: "foreground", plane: "foreground", depth: params.chamber.depthProfile.foreground, anchor: params.chamber.anchorMap.foreground === "north" ? "north" : params.chamber.anchorMap.foreground === "south" ? "south" : "center", vector: { x: shift.x * 0.65, y: shift.y * 0.7, z: shift.z * 0.8 }, scale: 1.02, opacity: 1, blur: 0, focusPriority: params.traversal.arrivalFocusPlane === "foreground" ? 1 : 0.84, pointerEvents: "auto", content: params.foreground, embodiedWeight: 1, pressureWeight: pressure, continuityWeight: continuity, recoveryWeight: recovery, entityDensity: params.entityMaterialization.entityPressure, focalGravity: params.entityMaterialization.actionSurfaceGravity, attenuation: 0.94, chamberPresence },
  ];
  return { nodes, state: { chamber: params.chamber, traversal: params.traversal, reducedMotion: params.reducedMotion } };
}
