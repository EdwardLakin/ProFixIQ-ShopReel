import type { RuntimeWorldOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import type { RuntimeWorldRegistry, RuntimeWorldLifecycleState } from "@/features/shopreel/ui/system/runtimeWorldRegistry";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export type RuntimeWorldPresenceState = "dominant" | "peripheral" | "ambient" | "emerging" | "interrupting" | "fading";
export type RuntimeAtmosphereState = "calm" | "focused" | "overloaded" | "urgent" | "unresolved" | "escalating" | "active_production" | "dormant";

export type RuntimeWorldHeat = {
  urgency: number;
  unresolvedTension: number;
  momentum: number;
  operationalPressure: number;
  activityDensity: number;
  escalationWeight: number;
  composite: number;
};

export type RuntimeInterruptionSignal = {
  worldId: RuntimeWorldId;
  strength: number;
  source: "heat" | "approval" | "render" | "upload" | "campaign" | "analytics";
  cue: string;
};

export type RuntimeWorldPresenceNode = {
  worldId: RuntimeWorldId;
  lifecycle: RuntimeWorldLifecycleState;
  presence: RuntimeWorldPresenceState;
  heat: RuntimeWorldHeat;
  bleedIntensity: number;
  topologyInfluence: number;
  interruptionRisk: number;
};

export type RuntimeWorldPresenceCoordinatorState = {
  foregroundWorldId: RuntimeWorldId;
  mountedWorldIds: RuntimeWorldId[];
  activeTopologyGraph: Record<RuntimeWorldId, { influence: number; bleed: number; pressure: number }>;
  worlds: Record<RuntimeWorldId, RuntimeWorldPresenceNode>;
  atmosphere: { state: RuntimeAtmosphereState; intensity: number; motionAttenuation: number; topologyGlow: number; drift: number };
  interruptionSignals: RuntimeInterruptionSignal[];
  pressurePropagation: number;
};

export function deriveWorldPresenceCoordinator(input: {
  nowIso: string;
  foregroundWorldId: RuntimeWorldId;
  registry: RuntimeWorldRegistry;
  orchestration: RuntimeWorldOrchestration;
  previousWorldId: RuntimeWorldId | null;
  unresolvedCount: number;
  reducedMotion: boolean;
}): RuntimeWorldPresenceCoordinatorState {
  const worlds = Object.values(input.registry.worlds);
  const foregroundWorldId = input.registry.foregroundWorldId ?? input.foregroundWorldId;

  const byId = new Map(worlds.map((w) => [w.worldId, w] as const));
  const dominantWeight = input.orchestration.attentionState === "escalated" ? 0.9 : 0.75;

  const graph: RuntimeWorldPresenceCoordinatorState["activeTopologyGraph"] = {} as RuntimeWorldPresenceCoordinatorState["activeTopologyGraph"];
  const nodes: RuntimeWorldPresenceCoordinatorState["worlds"] = {} as RuntimeWorldPresenceCoordinatorState["worlds"];

  for (const entry of worlds) {
    const relationWeight = entry.transitionRelationships.reduce((acc, rel) => acc + rel.weight, 0) / Math.max(1, entry.transitionRelationships.length);
    const pressure = clamp01(entry.continuityPressure * 0.4 + entry.unresolvedOperationalState * 0.35 + entry.environmentalIntensity * 0.25);
    const heat: RuntimeWorldHeat = {
      urgency: clamp01(pressure * 0.6 + (entry.worldId === foregroundWorldId ? 0.25 : 0)),
      unresolvedTension: entry.unresolvedOperationalState,
      momentum: clamp01(1 - (entry.lifecycle === "sleeping" || entry.lifecycle === "suspended" ? 0.65 : 0.1)),
      operationalPressure: pressure,
      activityDensity: clamp01(entry.environmentalIntensity * 0.55 + entry.topologyIntensity * 0.45),
      escalationWeight: clamp01((entry.lifecycle === "foreground" ? dominantWeight : 0.2) + (entry.unresolvedOperationalState > 0.55 ? 0.35 : 0)),
      composite: 0,
    };
    heat.composite = clamp01(heat.urgency * 0.25 + heat.unresolvedTension * 0.2 + heat.momentum * 0.15 + heat.operationalPressure * 0.2 + heat.activityDensity * 0.1 + heat.escalationWeight * 0.1);

    const interruptionRisk = clamp01(heat.composite * 0.55 + relationWeight * 0.45);
    const presence: RuntimeWorldPresenceState = entry.worldId === foregroundWorldId
      ? "dominant"
      : interruptionRisk > 0.7
        ? "interrupting"
        : heat.composite > 0.62
          ? "emerging"
          : entry.lifecycle === "background"
            ? "ambient"
            : entry.lifecycle === "sleeping" || entry.lifecycle === "suspended"
              ? "fading"
              : "peripheral";

    const bleedIntensity = clamp01(heat.activityDensity * 0.45 + relationWeight * 0.55);
    const topologyInfluence = clamp01(entry.topologyIntensity * 0.7 + heat.composite * 0.3);

    graph[entry.worldId] = { influence: topologyInfluence, bleed: bleedIntensity, pressure };
    nodes[entry.worldId] = { worldId: entry.worldId, lifecycle: entry.lifecycle, presence, heat, bleedIntensity, topologyInfluence, interruptionRisk };
  }

  const mountedWorldIds = Object.values(nodes)
    .filter((node) => node.presence !== "fading" || node.heat.composite > 0.35)
    .sort((a, b) => b.heat.composite - a.heat.composite)
    .map((node) => node.worldId)
    .slice(0, 5);

  const avgHeat = clamp01(Object.values(nodes).reduce((acc, node) => acc + node.heat.composite, 0) / Math.max(1, worlds.length));
  const unresolvedWeight = clamp01(input.unresolvedCount / 5);
  const pressurePropagation = clamp01(avgHeat * 0.6 + unresolvedWeight * 0.4);

  const atmosphereState: RuntimeAtmosphereState = avgHeat < 0.2
    ? "calm"
    : avgHeat < 0.35
      ? "focused"
      : avgHeat < 0.5
        ? "active_production"
        : avgHeat < 0.65
          ? "unresolved"
          : avgHeat < 0.75
            ? "urgent"
            : avgHeat < 0.88
              ? "escalating"
              : "overloaded";

  const interruptionSignals = Object.values(nodes)
    .filter((node) => node.worldId !== foregroundWorldId && node.interruptionRisk > 0.5)
    .sort((a, b) => b.interruptionRisk - a.interruptionRisk)
    .slice(0, 3)
    .map<RuntimeInterruptionSignal>((node) => ({
      worldId: node.worldId,
      strength: node.interruptionRisk,
      source: node.worldId === "review" ? "approval" : node.worldId === "render" ? "render" : node.worldId === "upload" ? "upload" : node.worldId === "campaign" ? "campaign" : "analytics",
      cue: node.presence === "interrupting" ? "recessed_chamber_glow" : "ambient_pressure_shift",
    }));

  if (input.previousWorldId && byId.has(input.previousWorldId) && !mountedWorldIds.includes(input.previousWorldId)) {
    mountedWorldIds.push(input.previousWorldId);
  }

  return {
    foregroundWorldId,
    mountedWorldIds,
    activeTopologyGraph: graph,
    worlds: nodes,
    pressurePropagation,
    interruptionSignals,
    atmosphere: {
      state: atmosphereState,
      intensity: clamp01(avgHeat * 0.8 + pressurePropagation * 0.2),
      motionAttenuation: input.reducedMotion ? 1 : clamp01(avgHeat * 0.55),
      topologyGlow: clamp01(pressurePropagation * 0.7 + interruptionSignals.length * 0.08),
      drift: clamp01((1 - pressurePropagation) * 0.25 + (input.reducedMotion ? 0 : 0.25)),
    },
  };
}
