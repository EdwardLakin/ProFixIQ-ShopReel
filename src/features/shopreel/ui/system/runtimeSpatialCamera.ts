import type { RuntimeTraversalState } from "@/features/shopreel/ui/system/runtimeTraversalEngine";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeCameraMode = "entering" | "settling" | "focused" | "scanning" | "returning" | "interrupted" | "recovering";
export type RuntimeCameraTarget = "foreground" | "midground" | "operator" | "peripheral";
export type RuntimeCameraMomentum = { continuity: number; orchestrationPressure: number; carryover: number };
export type RuntimeCameraInertia = { easingClassName: string; damping: number; translateScalar: number };
export type RuntimeCameraDepthFocus = { focalDistance: number; chamberZoom: number; depthBlur: number };
export type RuntimeCameraTraversalPath = { sourceWorld: RuntimeWorldId | null; targetWorld: RuntimeWorldId; direction: string; vector: { x: number; y: number; z: number } };
export type RuntimeCameraState = {
  mode: RuntimeCameraMode;
  target: RuntimeCameraTarget;
  momentum: RuntimeCameraMomentum;
  inertia: RuntimeCameraInertia;
  depthFocus: RuntimeCameraDepthFocus;
  traversalPath: RuntimeCameraTraversalPath;
  translate: { x: number; y: number };
};

export function deriveRuntimeSpatialCamera(params: { traversal: RuntimeTraversalState; reducedMotion: boolean; unresolvedCount: number; continuityMomentum: number }): RuntimeCameraState {
  const mode: RuntimeCameraMode = params.reducedMotion ? "focused" : params.unresolvedCount > 2 ? "recovering" : "settling";
  const target: RuntimeCameraTarget = params.traversal.arrivalFocusPlane === "operator" ? "operator" : params.traversal.arrivalFocusPlane === "midground" ? "midground" : "foreground";
  const carry = params.traversal.environmentalCarryover;
  return {
    mode,
    target,
    momentum: { continuity: params.continuityMomentum, orchestrationPressure: Math.min(1, params.unresolvedCount / 5), carryover: carry },
    inertia: {
      easingClassName: params.reducedMotion ? "ease-linear" : mode === "recovering" ? "ease-[cubic-bezier(.16,.84,.22,1)]" : "ease-[cubic-bezier(.22,.8,.24,1)]",
      damping: params.reducedMotion ? 1 : 0.82,
      translateScalar: params.reducedMotion ? 0 : 1 - carry * 0.35,
    },
    depthFocus: { focalDistance: params.reducedMotion ? 1 : 1.04 - carry * 0.08, chamberZoom: params.reducedMotion ? 1 : 1 + carry * 0.04, depthBlur: params.reducedMotion ? 0 : 0.2 + params.unresolvedCount * 0.03 },
    traversalPath: { sourceWorld: params.traversal.sourceWorld, targetWorld: params.traversal.targetWorld, direction: params.traversal.direction, vector: params.traversal.transitionVector },
    translate: {
      x: params.reducedMotion ? 0 : params.traversal.transitionVector.x * 14,
      y: params.reducedMotion ? 0 : params.traversal.transitionVector.y * 11,
    },
  };
}
