import type { RuntimeInteractionState } from "@/features/shopreel/ui/system/runtimeInteractionPolish";
import type { RuntimeSurfaceState } from "@/features/shopreel/ui/system/runtimeSurfaceCohesion";
import type { RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import type { RuntimeWorldOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";

export type RuntimeSpatialZone = "focal_path" | "operational_core" | "support_ring" | "peripheral_ring";
export type RuntimeAttentionField = "progression" | "evaluation" | "stabilization";
export type RuntimeOperationalGravity = { focalPull: number; supportClustering: number; peripheralDrift: number; blockerLift: number };
export type RuntimeNavigationVector = { axisX: number; axisY: number; depth: number; thresholdShift: number };

export type RuntimeFocalPath = {
  currentObjective: string;
  elevatedActionLabel: string;
  supportSystemIds: string[];
  directionalIntent: "forward" | "compare" | "recover";
};

export type RuntimePeripheralSurface = {
  id: string;
  zone: RuntimeSpatialZone;
  weight: number;
  role: "support" | "analytics" | "queue" | "review" | "library";
};

export type RuntimeEnvironment = {
  worldId: RuntimeWorldEntry["worldId"];
  identity: "campaign_chamber" | "review_chamber" | "operations_chamber" | "runtime_chamber";
  attentionField: RuntimeAttentionField;
  focalPath: RuntimeFocalPath;
  gravity: RuntimeOperationalGravity;
  navigationVector: RuntimeNavigationVector;
  peripheralSurfaces: RuntimePeripheralSurface[];
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function deriveRuntimeEnvironment(input: { entry: RuntimeWorldEntry; orchestration: RuntimeWorldOrchestration; interaction: RuntimeInteractionState; surface: RuntimeSurfaceState; reducedMotion: boolean }): RuntimeEnvironment {
  const identity = input.entry.worldId === "campaign" ? "campaign_chamber" : input.entry.worldId === "review" ? "review_chamber" : input.entry.worldId === "operations" ? "operations_chamber" : "runtime_chamber";
  const attentionField: RuntimeAttentionField = identity === "review_chamber" ? "evaluation" : identity === "operations_chamber" ? "stabilization" : "progression";
  const blockerWeight = clamp01(input.entry.blockers.length * 0.14 + input.entry.unresolvedCount * 0.08);
  const gravity: RuntimeOperationalGravity = {
    focalPull: clamp01(0.44 + input.interaction.guidanceCue.emphasis * 0.42),
    supportClustering: clamp01(0.28 + input.surface.panelCohesion.chainSync * 0.5),
    peripheralDrift: clamp01(0.2 + (1 - input.surface.continuity.resilienceWeight) * 0.48),
    blockerLift: clamp01(0.18 + blockerWeight),
  };
  const directionalIntent = attentionField === "progression" ? "forward" : attentionField === "evaluation" ? "compare" : "recover";
  const navigationVector: RuntimeNavigationVector = {
    axisX: directionalIntent === "compare" ? 0.14 : directionalIntent === "recover" ? -0.12 : 0.08,
    axisY: directionalIntent === "forward" ? -0.2 : directionalIntent === "recover" ? -0.1 : -0.04,
    depth: input.reducedMotion ? 0 : clamp01(0.22 + gravity.focalPull * 0.5),
    thresholdShift: clamp01(0.12 + gravity.blockerLift * 0.46),
  };

  const supportSystemIds = input.entry.secondaryActions.slice(0, 3).map((action) => action.id);
  const peripheralSurfaces: RuntimePeripheralSurface[] = input.entry.secondaryActions.map((action, index) => ({
    id: action.id,
    zone: index < 2 ? "support_ring" : "peripheral_ring",
    weight: clamp01(0.4 + gravity.supportClustering * 0.3 - index * 0.08),
    role: action.id.includes("analytic") ? "analytics" : action.id.includes("queue") || action.id.includes("publish") ? "queue" : action.id.includes("review") ? "review" : action.id.includes("library") ? "library" : "support",
  }));

  return {
    worldId: input.entry.worldId,
    identity,
    attentionField,
    gravity,
    navigationVector,
    focalPath: {
      currentObjective: input.entry.objective,
      elevatedActionLabel: input.entry.primaryAction?.label ?? "Maintain flow",
      supportSystemIds,
      directionalIntent,
    },
    peripheralSurfaces,
  };
}
