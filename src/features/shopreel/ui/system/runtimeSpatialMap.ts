import type { RuntimeEnvironment } from "@/features/shopreel/ui/system/runtimeEnvironment";
import { RUNTIME_WORLD_TOPOLOGY, type RuntimeSpatialAnchor } from "@/features/shopreel/ui/system/runtimeTopology";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { RuntimeOperatorPosition } from "@/features/shopreel/ui/system/runtimeOperatorPosition";

export type RuntimeSpatialMap = {
  anchor: RuntimeSpatialAnchor;
  fromAnchor: RuntimeSpatialAnchor | null;
  directionalShift: { x: number; y: number; z: number };
  traversal: "forward_drift" | "lateral_shift" | "elevated_transition" | "archival_descent" | "stabilized";
  attentionWeight: number;
  layers: { foreground: number; midground: number; background: number; distant: number };
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function deriveRuntimeSpatialMap(input: { worldId: RuntimeWorldId; previousWorldId: RuntimeWorldId | null; operator: RuntimeOperatorPosition | null; environment: RuntimeEnvironment; unresolvedCount: number; blockers: string[] }): RuntimeSpatialMap {
  const anchor = RUNTIME_WORLD_TOPOLOGY.anchors[input.worldId];
  const fromAnchor = input.previousWorldId ? RUNTIME_WORLD_TOPOLOGY.anchors[input.previousWorldId] : null;
  const directionalShift = {
    x: anchor.coordinate.x - (fromAnchor?.coordinate.x ?? anchor.coordinate.x),
    y: anchor.coordinate.y - (fromAnchor?.coordinate.y ?? anchor.coordinate.y),
    z: anchor.coordinate.z - (fromAnchor?.coordinate.z ?? anchor.coordinate.z),
  };
  const field = anchor.coordinate.field;
  const traversal = field === "forward" ? "forward_drift" : field === "lateral" ? "lateral_shift" : field === "elevated" ? "elevated_transition" : field === "deep" ? "archival_descent" : "stabilized";
  const urgency = clamp01(input.unresolvedCount * 0.08 + input.blockers.length * 0.12);
  const completionDrift = clamp01(1 - input.environment.gravity.focalPull);
  const attentionWeight = clamp01(0.34 + urgency * 0.54 + anchor.momentumBias * 0.2 - completionDrift * 0.2);
  const continuity = input.operator?.continuityState === "stable" ? 1 : input.operator?.continuityState === "recovering" ? 0.75 : 0.55;

  return {
    anchor,
    fromAnchor,
    directionalShift,
    traversal,
    attentionWeight,
    layers: {
      foreground: clamp01(0.58 + attentionWeight * 0.35),
      midground: clamp01(0.42 + continuity * 0.25),
      background: clamp01(0.3 + anchor.compression * 0.26),
      distant: clamp01(0.18 + completionDrift * 0.46),
    },
  };
}
