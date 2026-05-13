import type { RuntimeTraversalState } from "@/features/shopreel/ui/system/runtimeTraversalEngine";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeCameraVector = { x: number; y: number; z: number };
export type RuntimeCameraFocusRegion = "foreground" | "midground" | "operator" | "peripheral";
export type RuntimeCameraInterpolation = { easingClassName: string; damping: number; settleMs: number };
export type RuntimeCameraContinuityMemory = { previousWorld: RuntimeWorldId | null; previousFocus: RuntimeCameraFocusRegion; inertia: number };
export type RuntimeCameraRecoveryState = "stable" | "recovering" | "stabilizing";
export type RuntimeCameraField = {
  mode: "settling" | "focused" | "recovering";
  target: RuntimeCameraFocusRegion;
  vector: RuntimeCameraVector;
  interpolation: RuntimeCameraInterpolation;
  continuityMemory: RuntimeCameraContinuityMemory;
  recovery: RuntimeCameraRecoveryState;
  translate: { x: number; y: number };
};

export function deriveRuntimeSpatialCamera(params: { traversal: RuntimeTraversalState; reducedMotion: boolean; unresolvedCount: number; continuityMomentum: number; rememberedFocus?: RuntimeCameraFocusRegion | null }): RuntimeCameraField {
  const target: RuntimeCameraFocusRegion = params.rememberedFocus ?? (params.traversal.arrivalFocusPlane === "operator" ? "operator" : params.traversal.arrivalFocusPlane);
  const recovery: RuntimeCameraRecoveryState = params.unresolvedCount > 1 ? "recovering" : params.traversal.interruptedRecovery === "recovering" ? "stabilizing" : "stable";
  const mode = params.reducedMotion ? "focused" : recovery === "recovering" ? "recovering" : "settling";
  const vector = params.traversal.transitionVector;
  const inertia = Math.min(1, params.continuityMomentum + params.traversal.environmentalCarryover * 0.5);
  return {
    mode,
    target,
    vector,
    interpolation: { easingClassName: params.reducedMotion ? "ease-linear" : recovery === "recovering" ? "ease-[cubic-bezier(.18,.82,.26,1)]" : "ease-[cubic-bezier(.22,.8,.24,1)]", damping: params.reducedMotion ? 1 : 0.8 + (1 - inertia) * 0.12, settleMs: params.reducedMotion ? 0 : recovery === "recovering" ? 760 : 520 },
    continuityMemory: { previousWorld: params.traversal.sourceWorld, previousFocus: target, inertia },
    recovery,
    translate: { x: params.reducedMotion ? 0 : vector.x * 11 * (1 - params.traversal.environmentalCarryover * 0.2), y: params.reducedMotion ? 0 : vector.y * 9 * (1 - params.traversal.environmentalCarryover * 0.2) },
  };
}
