import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";

export type RuntimeChamberIdentity = RuntimeWorldEntry["worldKind"];

export type RuntimeChamberBackdrop = {
  horizonGlow: number;
  fogDensity: number;
  silhouetteDepth: number;
  volumetricBands: number;
};

export type RuntimeChamberMotionLanguage = {
  axis: "forward" | "lateral" | "orbital";
  easing: "settle" | "guided" | "elastic";
  drift: number;
};

export type RuntimeChamberDepthProfile = {
  foreground: number;
  midground: number;
  background: number;
  peripheral: number;
  atmosphere: number;
};

export type RuntimeChamberAnchorMap = {
  operator: "north-east" | "north-west" | "south-east" | "south-west";
  foreground: "north" | "center" | "south";
  manual: "center" | "west" | "east";
};

export type RuntimeChamberGeometry = {
  identity: RuntimeChamberIdentity;
  chamberWidth: number;
  chamberHeight: number;
  depthProfile: RuntimeChamberDepthProfile;
  directionalBias: { x: number; y: number; z: number };
  anchorMap: RuntimeChamberAnchorMap;
  backdrop: RuntimeChamberBackdrop;
  motionLanguage: RuntimeChamberMotionLanguage;
};

const GEOMETRY_BY_WORLD: Record<RuntimeChamberIdentity, RuntimeChamberGeometry> = {
  campaign: { identity: "campaign", chamberWidth: 1.3, chamberHeight: 1.05, directionalBias: { x: 0.22, y: -0.08, z: 0.16 }, depthProfile: { foreground: 0.9, midground: 0.68, background: 0.44, peripheral: 0.3, atmosphere: 0.18 }, anchorMap: { operator: "north-east", foreground: "north", manual: "west" }, backdrop: { horizonGlow: 0.72, fogDensity: 0.32, silhouetteDepth: 0.48, volumetricBands: 4 }, motionLanguage: { axis: "lateral", easing: "guided", drift: 0.28 } },
  review: { identity: "review", chamberWidth: 1, chamberHeight: 0.9, directionalBias: { x: 0.08, y: -0.12, z: 0.08 }, depthProfile: { foreground: 0.96, midground: 0.72, background: 0.35, peripheral: 0.28, atmosphere: 0.14 }, anchorMap: { operator: "north-west", foreground: "center", manual: "center" }, backdrop: { horizonGlow: 0.4, fogDensity: 0.26, silhouetteDepth: 0.35, volumetricBands: 3 }, motionLanguage: { axis: "forward", easing: "settle", drift: 0.16 } },
  generation: { identity: "generation", chamberWidth: 1.18, chamberHeight: 1.02, directionalBias: { x: 0.18, y: -0.06, z: 0.2 }, depthProfile: { foreground: 0.92, midground: 0.7, background: 0.42, peripheral: 0.32, atmosphere: 0.2 }, anchorMap: { operator: "south-east", foreground: "north", manual: "center" }, backdrop: { horizonGlow: 0.62, fogDensity: 0.34, silhouetteDepth: 0.52, volumetricBands: 5 }, motionLanguage: { axis: "orbital", easing: "elastic", drift: 0.32 } },
  render: { identity: "render", chamberWidth: 1.1, chamberHeight: 0.96, directionalBias: { x: 0.14, y: -0.04, z: 0.26 }, depthProfile: { foreground: 0.9, midground: 0.66, background: 0.4, peripheral: 0.3, atmosphere: 0.17 }, anchorMap: { operator: "north-east", foreground: "center", manual: "east" }, backdrop: { horizonGlow: 0.52, fogDensity: 0.3, silhouetteDepth: 0.5, volumetricBands: 4 }, motionLanguage: { axis: "forward", easing: "guided", drift: 0.24 } },
  publish: { identity: "publish", chamberWidth: 1.24, chamberHeight: 1, directionalBias: { x: 0.24, y: -0.02, z: 0.18 }, depthProfile: { foreground: 0.9, midground: 0.68, background: 0.38, peripheral: 0.34, atmosphere: 0.22 }, anchorMap: { operator: "south-west", foreground: "south", manual: "east" }, backdrop: { horizonGlow: 0.68, fogDensity: 0.24, silhouetteDepth: 0.42, volumetricBands: 4 }, motionLanguage: { axis: "lateral", easing: "guided", drift: 0.2 } },
  analytics: { identity: "analytics", chamberWidth: 1.4, chamberHeight: 1.06, directionalBias: { x: 0.12, y: -0.1, z: 0.12 }, depthProfile: { foreground: 0.86, midground: 0.64, background: 0.5, peripheral: 0.4, atmosphere: 0.24 }, anchorMap: { operator: "north-east", foreground: "center", manual: "west" }, backdrop: { horizonGlow: 0.76, fogDensity: 0.22, silhouetteDepth: 0.58, volumetricBands: 5 }, motionLanguage: { axis: "orbital", easing: "settle", drift: 0.18 } },
  operations: { identity: "operations", chamberWidth: 1.12, chamberHeight: 0.92, directionalBias: { x: -0.12, y: -0.08, z: 0.2 }, depthProfile: { foreground: 0.94, midground: 0.7, background: 0.38, peripheral: 0.3, atmosphere: 0.2 }, anchorMap: { operator: "north-west", foreground: "center", manual: "center" }, backdrop: { horizonGlow: 0.48, fogDensity: 0.3, silhouetteDepth: 0.5, volumetricBands: 4 }, motionLanguage: { axis: "forward", easing: "settle", drift: 0.12 } },
  library: { identity: "library", chamberWidth: 1.16, chamberHeight: 1, directionalBias: { x: -0.08, y: -0.04, z: 0.1 }, depthProfile: { foreground: 0.86, midground: 0.62, background: 0.48, peripheral: 0.34, atmosphere: 0.22 }, anchorMap: { operator: "south-east", foreground: "south", manual: "west" }, backdrop: { horizonGlow: 0.42, fogDensity: 0.2, silhouetteDepth: 0.56, volumetricBands: 3 }, motionLanguage: { axis: "lateral", easing: "settle", drift: 0.1 } },
  upload: { identity: "upload", chamberWidth: 1.04, chamberHeight: 0.94, directionalBias: { x: -0.04, y: -0.1, z: 0.16 }, depthProfile: { foreground: 0.92, midground: 0.72, background: 0.36, peripheral: 0.24, atmosphere: 0.15 }, anchorMap: { operator: "north-west", foreground: "north", manual: "center" }, backdrop: { horizonGlow: 0.5, fogDensity: 0.28, silhouetteDepth: 0.32, volumetricBands: 3 }, motionLanguage: { axis: "forward", easing: "guided", drift: 0.14 } },
};

export function deriveRuntimeChamberGeometry(worldKind: RuntimeChamberIdentity): RuntimeChamberGeometry {
  return GEOMETRY_BY_WORLD[worldKind];
}
