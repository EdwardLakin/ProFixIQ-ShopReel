import type { RuntimeCameraState } from "@/features/shopreel/ui/system/runtimeSpatialTransition";
import type { RuntimeWorldAction, RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";

export type RuntimeWorldDepthPriority = "critical" | "high" | "medium" | "low";
export type RuntimeWorldLayer = "foreground" | "midground" | "background" | "atmosphere" | "operator";

export type RuntimeWorldCameraState = {
  phase: "card_entry" | "world_resolve" | "focus_settle" | "immersed";
  scale: number;
  translateY: number;
  blur: number;
  overlayOpacity: number;
};

export type RuntimeWorldFocalObject = {
  id: string;
  label: string;
  description: string;
  action: RuntimeWorldAction | null;
  priority: RuntimeWorldDepthPriority;
};

export type RuntimeWorldActionPlane = {
  id: string;
  layer: RuntimeWorldLayer;
  title: string;
  href: string;
  priority: RuntimeWorldDepthPriority;
};

export type RuntimeWorldBackgroundSurface = {
  layer: "atmosphere" | "background";
  visualSeed: string;
  tonalClass: string;
  orbClass: string;
  gridClass: string;
};

export type RuntimeWorldDepthScene = {
  worldId: RuntimeWorldEntry["worldId"];
  camera: RuntimeWorldCameraState;
  focalObject: RuntimeWorldFocalObject;
  foreground: RuntimeWorldActionPlane;
  midground: RuntimeWorldActionPlane;
  background: RuntimeWorldActionPlane[];
  backgroundSurface: RuntimeWorldBackgroundSurface;
};

export function deriveRuntimeWorldCamera(camera: RuntimeCameraState, reducedMotion: boolean): RuntimeWorldCameraState {
  if (reducedMotion) return { phase: "immersed", scale: 1, translateY: 0, blur: 0, overlayOpacity: 0 };
  if (camera === "docked") return { phase: "card_entry", scale: 0.98, translateY: 22, blur: 7, overlayOpacity: 0.26 };
  if (camera === "entering") return { phase: "world_resolve", scale: 0.992, translateY: 14, blur: 3, overlayOpacity: 0.18 };
  if (camera === "focusing") return { phase: "focus_settle", scale: 0.998, translateY: 6, blur: 1, overlayOpacity: 0.08 };
  if (camera === "recovering") return { phase: "focus_settle", scale: 0.998, translateY: 4, blur: 1, overlayOpacity: 0.06 };
  if (camera === "returning") return { phase: "world_resolve", scale: 0.992, translateY: 16, blur: 3, overlayOpacity: 0.16 };
  return { phase: "immersed", scale: 1, translateY: 0, blur: 0, overlayOpacity: 0 };
}
