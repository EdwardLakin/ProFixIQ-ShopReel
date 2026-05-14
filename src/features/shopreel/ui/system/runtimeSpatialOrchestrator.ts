import type { RuntimeAttentionEngineOutput } from "@/features/shopreel/ui/system/runtimeAttentionEngine";
import type { RuntimeRouteTransitionEngine } from "@/features/shopreel/ui/system/runtimeRouteTransitionEngine";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { RuntimeWorldPresenceCoordinatorState } from "@/features/shopreel/ui/system/worldPresenceCoordinator";
import { RUNTIME_WORLD_TOPOLOGY } from "@/features/shopreel/ui/system/runtimeTopology";

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

type ChamberAdjacencyMap = Partial<Record<RuntimeWorldId, RuntimeWorldId[]>>;

export type RuntimeSpatialOrchestrationState = {
  activeChamberVector: { x: number; y: number; z: number; worldId: RuntimeWorldId };
  ambientDrift: number;
  tensionField: number;
  atmosphericDensity: number;
  interruptionTrajectory: { worldId: RuntimeWorldId | null; intensity: number; directionalBias: "forward" | "lateral" | "elevated" | "deep" | "stabilize" };
  worldAdjacencyMap: Partial<Record<RuntimeWorldId, RuntimeWorldId[]>>;
  focalGravity: number;
  environmentalMotionProfile: { lowFrequencyMotion: number; pressureGradient: number; continuityBias: number; directionalFlow: number };
};

const CHAMBER_ADJACENCY: ChamberAdjacencyMap = {
  campaign: ["render", "publish", "review", "operations", "idea"],
  render: ["campaign", "publish", "operations", "upload"],
  publish: ["render", "analytics", "campaign", "operations"],
  analytics: ["publish", "calendar", "operations"],
  idea: ["campaign", "generation", "operations"],
  upload: ["render", "asset_library", "operations"],
  operations: ["campaign", "render", "publish", "analytics", "idea", "upload", "review", "automation"],
};

function mergeAdjacency(worldId: RuntimeWorldId): RuntimeWorldId[] {
  const topology = RUNTIME_WORLD_TOPOLOGY.adjacencyGraph[worldId] ?? [];
  const chamber = CHAMBER_ADJACENCY[worldId] ?? [];
  return Array.from(new Set([...topology, ...chamber]));
}

export function deriveRuntimeSpatialOrchestrator(input: {
  worldPresence: RuntimeWorldPresenceCoordinatorState;
  transition: RuntimeRouteTransitionEngine;
  attention: RuntimeAttentionEngineOutput;
  continuityPressure: number;
  previousState?: Partial<RuntimeSpatialOrchestrationState> | null;
}): RuntimeSpatialOrchestrationState {
  const worldId = input.worldPresence.foregroundWorldId;
  const anchor = RUNTIME_WORLD_TOPOLOGY.anchors[worldId];
  const adjacency = mergeAdjacency(worldId);
  const adjacencyPressure = clamp01(adjacency.reduce((acc, adjacentId) => acc + (input.worldPresence.worlds[adjacentId]?.heat.composite ?? 0), 0) / Math.max(1, adjacency.length));
  const focusPressure = clamp01(input.attention.atmosphericTension * 0.62 + input.worldPresence.pressurePropagation * 0.38);
  const driftMomentum = clamp01((input.previousState?.ambientDrift ?? 0.2) * 0.42 + input.worldPresence.atmosphere.drift * 0.58);

  const activeChamberVector = {
    x: (anchor?.coordinate.x ?? 0) + (input.transition.continuity.directionalContinuity - 0.5) * 0.2,
    y: (anchor?.coordinate.y ?? 0) + (focusPressure - 0.5) * 0.16,
    z: (anchor?.coordinate.z ?? 0) + adjacencyPressure * 0.24,
    worldId,
  };

  const interruptionLead = input.worldPresence.interruptionSignals[0] ?? null;
  const interruptionAnchor = interruptionLead ? RUNTIME_WORLD_TOPOLOGY.anchors[interruptionLead.worldId] : null;
  const interruptionTrajectory = {
    worldId: interruptionLead?.worldId ?? null,
    intensity: clamp01((interruptionLead?.strength ?? 0) * 0.7 + adjacencyPressure * 0.3),
    directionalBias: interruptionAnchor?.coordinate.field ?? "stabilize",
  } as const;

  const worldAdjacencyMap = Object.keys(input.worldPresence.worlds).reduce((acc, id) => {
    const runtimeWorldId = id as RuntimeWorldId;
    acc[runtimeWorldId] = mergeAdjacency(runtimeWorldId);
    return acc;
  }, {} as Record<RuntimeWorldId, RuntimeWorldId[]>);

  return {
    activeChamberVector,
    ambientDrift: driftMomentum,
    tensionField: clamp01(input.worldPresence.pressurePropagation * 0.46 + adjacencyPressure * 0.34 + (input.previousState?.tensionField ?? 0) * 0.2),
    atmosphericDensity: clamp01(input.worldPresence.atmosphere.intensity * 0.55 + input.continuityPressure * 0.3 + adjacencyPressure * 0.15),
    interruptionTrajectory,
    worldAdjacencyMap,
    focalGravity: clamp01(focusPressure * 0.56 + input.transition.continuity.focalPersistence.persistenceWeight * 0.44),
    environmentalMotionProfile: {
      lowFrequencyMotion: clamp01(input.worldPresence.atmosphere.motionAttenuation * 0.35 + driftMomentum * 0.65),
      pressureGradient: clamp01(focusPressure * 0.5 + adjacencyPressure * 0.5),
      continuityBias: clamp01(input.transition.continuity.directionalContinuity * 0.6 + input.continuityPressure * 0.4),
      directionalFlow: clamp01(RUNTIME_WORLD_TOPOLOGY.directionalFlowBias * 0.5 + (anchor?.momentumBias ?? 0.4) * 0.5),
    },
  };
}
