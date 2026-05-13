import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";

type RuntimeWorldKind = RuntimeWorldEntry["worldKind"];

export type RuntimePlaneDepth = "foreground" | "midground" | "operator" | "peripheral" | "background" | "distant";

export type RuntimePlaneAnchor =
  | "center"
  | "north"
  | "south"
  | "east"
  | "west"
  | "north-east"
  | "north-west"
  | "south-east"
  | "south-west";

export type RuntimePlaneInteractionMode = "focal_action" | "supporting_action" | "operator_guided" | "background_action" | "escape_route" | "blocked_action" | "recovery_action";

export type RuntimeSpatialOrigin = { x: number; y: number; z: number };
export type RuntimeTopologyPlacement = { region: "core" | "lateral" | "rear" | "elevated"; biasX: number; biasY: number };
export type RuntimePlanePerspective = { distance: number; tiltDeg: number; yawDeg: number; rollDeg: number; };
export type RuntimePlaneTransform = {
  anchor: RuntimePlaneAnchor;
  depth: RuntimePlaneDepth;
  origin: RuntimeSpatialOrigin;
  placement: RuntimeTopologyPlacement;
  scale: number;
  opacity: number;
  blur: number;
  rotationBiasDeg: number;
  parallaxVector: { x: number; y: number; z: number };
  perspective: RuntimePlanePerspective;
};

export type RuntimeScenePlane = {
  id: string;
  transform: RuntimePlaneTransform;
  interactionMode: RuntimePlaneInteractionMode;
  focusPriority: number;
};

const WORLD_BIAS: Record<RuntimeWorldKind, number> = {
  ingestion: -0.08,
  planning: -0.02,
  creation: 0.02,
  review: 0.04,
  publishing: 0.06,
  campaign: 0.08,
  analytics: 0.01,
  command: 0,
  operations: 0.05,
};

export function deriveRuntimePlaneGeometry(worldKind: RuntimeWorldKind): Record<RuntimePlaneDepth, RuntimeScenePlane> {
  const bias = WORLD_BIAS[worldKind] ?? 0;
  return {
    foreground: { id: "foreground", interactionMode: "focal_action", focusPriority: 100, transform: { anchor: "south", depth: "foreground", origin: { x: 0, y: 0.22, z: 0.95 }, placement: { region: "core", biasX: 0, biasY: 0.18 }, scale: 1.04, opacity: 1, blur: 0, rotationBiasDeg: 0.1 + bias, parallaxVector: { x: 0.02, y: -0.02, z: 0.18 }, perspective: { distance: 660, tiltDeg: 0, yawDeg: 0, rollDeg: 0 } } },
    midground: { id: "midground", interactionMode: "supporting_action", focusPriority: 88, transform: { anchor: "center", depth: "midground", origin: { x: 0, y: 0.06, z: 0.54 }, placement: { region: "core", biasX: 0.01, biasY: 0.06 }, scale: 0.96, opacity: 0.97, blur: 0, rotationBiasDeg: 0.25 + bias, parallaxVector: { x: 0.04, y: -0.01, z: 0.12 }, perspective: { distance: 980, tiltDeg: 0.5, yawDeg: 0.5, rollDeg: 0 } } },
    operator: { id: "operator", interactionMode: "operator_guided", focusPriority: 82, transform: { anchor: "east", depth: "operator", origin: { x: 0.27, y: -0.02, z: 0.42 }, placement: { region: "lateral", biasX: 0.24, biasY: -0.04 }, scale: 0.92, opacity: 0.95, blur: 0, rotationBiasDeg: -0.65 + bias, parallaxVector: { x: 0.05, y: 0.01, z: 0.09 }, perspective: { distance: 1100, tiltDeg: 0.8, yawDeg: -1, rollDeg: 0.2 } } },
    peripheral: { id: "peripheral", interactionMode: "supporting_action", focusPriority: 70, transform: { anchor: "west", depth: "peripheral", origin: { x: -0.24, y: 0.02, z: 0.33 }, placement: { region: "lateral", biasX: -0.22, biasY: 0.04 }, scale: 0.86, opacity: 0.86, blur: 0.2, rotationBiasDeg: 0.9 + bias, parallaxVector: { x: 0.08, y: -0.02, z: 0.08 }, perspective: { distance: 1260, tiltDeg: 1.2, yawDeg: 1.5, rollDeg: -0.3 } } },
    background: { id: "background", interactionMode: "background_action", focusPriority: 50, transform: { anchor: "north", depth: "background", origin: { x: 0, y: -0.22, z: 0.2 }, placement: { region: "rear", biasX: 0, biasY: -0.18 }, scale: 0.8, opacity: 0.72, blur: 0.35, rotationBiasDeg: 0.3 + bias, parallaxVector: { x: 0.03, y: 0.01, z: 0.04 }, perspective: { distance: 1380, tiltDeg: 1.4, yawDeg: 0, rollDeg: 0 } } },
    distant: { id: "distant", interactionMode: "recovery_action", focusPriority: 24, transform: { anchor: "north", depth: "distant", origin: { x: 0, y: -0.3, z: 0.08 }, placement: { region: "elevated", biasX: 0, biasY: -0.22 }, scale: 0.74, opacity: 0.6, blur: 0.45, rotationBiasDeg: 0.15 + bias, parallaxVector: { x: 0.01, y: 0.01, z: 0.01 }, perspective: { distance: 1600, tiltDeg: 2.2, yawDeg: 0, rollDeg: 0 } } },
  };
}
