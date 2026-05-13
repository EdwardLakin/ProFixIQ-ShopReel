import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import type { RuntimeChamberGeometry } from "@/features/shopreel/ui/system/runtimeChamberGeometry";
import type { RuntimeTraversalState } from "@/features/shopreel/ui/system/runtimeTraversalEngine";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

type RuntimeWorldKind = RuntimeWorldEntry["worldKind"];

export type RuntimePlaneDepth = "foreground" | "midground" | "operator" | "peripheral" | "background" | "distant";
export type RuntimePlaneAnchor = "center" | "north" | "south" | "east" | "west" | "north-east" | "north-west" | "south-east" | "south-west";
export type RuntimePlaneAxis = "x" | "y" | "z";
export type RuntimePlaneCoordinate = { x: number; y: number; z: number; origin: "chamber" | "continuity" | "topology" };
export type RuntimePlaneField = { chamberAxis: RuntimePlaneCoordinate; continuityOffset: RuntimePlaneCoordinate; topologyDrift: RuntimePlaneCoordinate; environmentalScale: number };
export type RuntimePlaneRegion = "core" | "lateral" | "rear" | "elevated";
export type RuntimeSpatialRelationship = { anchor: RuntimePlaneAnchor; region: RuntimePlaneRegion; focalWeight: number; interactionDistance: number };
export type RuntimeDepthAttenuation = { opacity: number; blur: number; fog: number };
export type RuntimePerspectiveField = { distance: number; scale: number; tiltDeg: number; yawDeg: number; rollDeg: number };
export type RuntimeParallaxBand = { band: "stable" | "guided" | "reactive"; vector: { x: number; y: number; z: number } };

export type RuntimeScenePlane = {
  id: string;
  depth: RuntimePlaneDepth;
  field: RuntimePlaneField;
  relationship: RuntimeSpatialRelationship;
  attenuation: RuntimeDepthAttenuation;
  perspective: RuntimePerspectiveField;
  parallax: RuntimeParallaxBand;
  focusPriority: number;
  interactionMode: "focal_action" | "supporting_action" | "operator_guided" | "background_action" | "recovery_action";
};

const DEPTH_INDEX: Record<RuntimePlaneDepth, number> = { foreground: 0.95, midground: 0.64, operator: 0.56, peripheral: 0.42, background: 0.22, distant: 0.08 };
const WORLD_BIAS: Record<RuntimeWorldId, number> = { campaign: 0.03, idea: 0.04, upload: 0, asset_library: -0.03, generation: 0.06, video_creation: 0.05, review: -0.02, render: 0.05, publish: 0.02, calendar: 0.01, analytics: -0.01, automation: -0.02, operations: 0.01 };

function plane(depth: RuntimePlaneDepth, worldKind: RuntimeWorldKind, chamber: RuntimeChamberGeometry, traversal: RuntimeTraversalState): RuntimeScenePlane {
  const depthUnit = DEPTH_INDEX[depth];
  const bias = WORLD_BIAS[worldKind] ?? 0;
  const carry = traversal.environmentalCarryover;
  const drift = chamber.motionLanguage.drift;
  const dir = traversal.transitionVector;
  const focalWeight = depth === traversal.arrivalFocusPlane ? 1 : depth === "operator" ? 0.78 : 0.58;
  return {
    id: depth,
    depth,
    field: {
      chamberAxis: { x: chamber.directionalBias.x * depthUnit, y: chamber.directionalBias.y * depthUnit, z: chamber.directionalBias.z * depthUnit, origin: "chamber" },
      continuityOffset: { x: dir.x * 0.14 * (1 - depthUnit), y: dir.y * 0.12 * (1 - depthUnit), z: dir.z * 0.18 * (1 - depthUnit), origin: "continuity" },
      topologyDrift: { x: drift * 0.1 + bias, y: -drift * 0.05, z: drift * 0.14, origin: "topology" },
      environmentalScale: 1 + carry * 0.06 - (1 - depthUnit) * 0.08,
    },
    relationship: {
      anchor: depth === "operator" ? chamber.anchorMap.operator : depth === "foreground" ? chamber.anchorMap.foreground === "center" ? "center" : chamber.anchorMap.foreground : depth === "peripheral" ? "west" : "center",
      region: depth === "operator" || depth === "peripheral" ? "lateral" : depth === "background" || depth === "distant" ? "rear" : "core",
      focalWeight,
      interactionDistance: 1 - depthUnit,
    },
    attenuation: { opacity: 1 - (1 - depthUnit) * 0.45, blur: (1 - depthUnit) * 0.8, fog: (1 - depthUnit) * 0.6 },
    perspective: { distance: 680 + (1 - depthUnit) * 980, scale: 0.86 + depthUnit * 0.22, tiltDeg: (1 - depthUnit) * 1.5, yawDeg: chamber.directionalBias.x * 3, rollDeg: chamber.motionLanguage.axis === "orbital" ? 0.35 : 0.1 },
    parallax: { band: depthUnit > 0.7 ? "stable" : depthUnit > 0.3 ? "guided" : "reactive", vector: { x: dir.x * (1 - depthUnit) * 0.5, y: dir.y * (1 - depthUnit) * 0.45, z: dir.z * (1 - depthUnit) * 0.4 } },
    focusPriority: Math.round(focalWeight * 100),
    interactionMode: depth === "foreground" ? "focal_action" : depth === "operator" ? "operator_guided" : depth === "background" || depth === "distant" ? "background_action" : "supporting_action",
  };
}

export function deriveRuntimePlaneGeometry(worldKind: RuntimeWorldKind, chamber: RuntimeChamberGeometry, traversal: RuntimeTraversalState): Record<RuntimePlaneDepth, RuntimeScenePlane> {
  return { foreground: plane("foreground", worldKind, chamber, traversal), midground: plane("midground", worldKind, chamber, traversal), operator: plane("operator", worldKind, chamber, traversal), peripheral: plane("peripheral", worldKind, chamber, traversal), background: plane("background", worldKind, chamber, traversal), distant: plane("distant", worldKind, chamber, traversal) };
}
