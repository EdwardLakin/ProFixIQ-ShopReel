import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { RuntimeWorldPresenceCoordinatorState } from "@/features/shopreel/ui/system/worldPresenceCoordinator";

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export type RuntimeWorldTopologyNode = {
  worldId: RuntimeWorldId;
  slotIndex: number;
  depthTier: "near" | "mid" | "far";
  heatIntensity: number;
  interruptionPressure: number;
  semanticLabel: string;
  motif: "orbit_rings" | "spark_branch" | "asset_vault" | "motion_rail" | "timeline_corridor" | "telemetry_grid" | "command_core";
  xPercent: number;
  yPercent: number;
};

export type RuntimeWorldTopologyState = {
  foregroundWorldId: RuntimeWorldId;
  nodes: RuntimeWorldTopologyNode[];
  ambientPressure: number;
};

const TOPOLOGY_SLOTS = [
  { x: 14, y: 22 },
  { x: 83, y: 24 },
  { x: 24, y: 64 },
  { x: 76, y: 68 },
  { x: 50, y: 34 },
  { x: 9, y: 51 },
  { x: 91, y: 50 },
] as const;

const WORLD_SEMANTICS: Record<RuntimeWorldId, { label: string; motif: RuntimeWorldTopologyNode["motif"] }> = {
  campaign: { label: "Campaign execution stage", motif: "orbit_rings" },
  idea: { label: "Idea spark field", motif: "spark_branch" },
  upload: { label: "Upload asset vault", motif: "asset_vault" },
  asset_library: { label: "Library media vault", motif: "asset_vault" },
  generation: { label: "Generation motion rail", motif: "motion_rail" },
  video_creation: { label: "Video creation rail", motif: "motion_rail" },
  review: { label: "Review corridor", motif: "timeline_corridor" },
  render: { label: "Render queue lane", motif: "motion_rail" },
  publish: { label: "Publish timeline corridor", motif: "timeline_corridor" },
  calendar: { label: "Calendar timeline corridor", motif: "timeline_corridor" },
  analytics: { label: "Analytics telemetry grid", motif: "telemetry_grid" },
  automation: { label: "Automation stabilization zone", motif: "command_core" },
  operations: { label: "Operations command core", motif: "command_core" },
};

export function deriveRuntimeWorldTopologyLayer(input: { worldPresence: RuntimeWorldPresenceCoordinatorState; cap?: number }): RuntimeWorldTopologyState {
  const cap = Math.max(1, Math.min(6, input.cap ?? 4));
  const nodes = input.worldPresence.mountedWorldIds
    .filter((worldId) => worldId !== input.worldPresence.foregroundWorldId)
    .map((worldId) => input.worldPresence.worlds[worldId])
    .filter((world): world is NonNullable<typeof world> => Boolean(world))
    .sort((a, b) => b.topologyInfluence - a.topologyInfluence)
    .slice(0, cap)
    .map((world, index): RuntimeWorldTopologyNode => {
      const slot = TOPOLOGY_SLOTS[index % TOPOLOGY_SLOTS.length];
      const intensity = clamp01(world.heat.composite * 0.68 + world.topologyInfluence * 0.32);
      const interruption = clamp01(world.interruptionRisk);
      const depthTier: RuntimeWorldTopologyNode["depthTier"] = interruption > 0.75 ? "near" : intensity > 0.52 ? "mid" : "far";
      const semantics = WORLD_SEMANTICS[world.worldId] ?? { label: "Operational chamber", motif: "command_core" as const };
      return {
        worldId: world.worldId,
        slotIndex: index,
        depthTier,
        heatIntensity: intensity,
        interruptionPressure: interruption,
        semanticLabel: semantics.label,
        motif: semantics.motif,
        xPercent: slot.x,
        yPercent: slot.y,
      };
    });

  return {
    foregroundWorldId: input.worldPresence.foregroundWorldId,
    nodes,
    ambientPressure: clamp01(input.worldPresence.pressurePropagation * 0.7 + input.worldPresence.atmosphere.intensity * 0.3),
  };
}
