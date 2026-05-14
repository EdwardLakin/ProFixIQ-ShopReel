import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export type RuntimeWorldLifecycleState = "foreground" | "active" | "background" | "sleeping" | "suspended";
export type RuntimeWorldTransitionRelationship = { toWorldId: RuntimeWorldId; weight: number; reason: string; updatedAt: string };
export type RuntimeWorldEntityFocus = { entityId: string | null; entityKind: string | null; missionId: string | null };
export type RuntimeWorldRegistryEntry = {
  worldId: RuntimeWorldId;
  lifecycle: RuntimeWorldLifecycleState;
  lastInteractionAt: string;
  continuityPressure: number;
  unresolvedOperationalState: number;
  environmentalIntensity: number;
  topologyIntensity: number;
  activeMissionFocus: RuntimeWorldEntityFocus;
  transitionRelationships: RuntimeWorldTransitionRelationship[];
};

export type RuntimeWorldRegistry = {
  foregroundWorldId: RuntimeWorldId | null;
  activeWorldIds: RuntimeWorldId[];
  sleepingWorldIds: RuntimeWorldId[];
  worlds: Record<RuntimeWorldId, RuntimeWorldRegistryEntry>;
  updatedAt: string;
};

export function createRuntimeWorldRegistry(): RuntimeWorldRegistry {
  return { foregroundWorldId: null, activeWorldIds: [], sleepingWorldIds: [], worlds: {} as Record<RuntimeWorldId, RuntimeWorldRegistryEntry>, updatedAt: new Date(0).toISOString() };
}

export function upsertRuntimeWorldRegistry(input: { registry: RuntimeWorldRegistry | null; worldId: RuntimeWorldId; lifecycle: RuntimeWorldLifecycleState; nowIso: string; continuityPressure: number; unresolvedOperationalState: number; environmentalIntensity: number; topologyIntensity: number; entityFocus: RuntimeWorldEntityFocus; relationship?: RuntimeWorldTransitionRelationship | null }): RuntimeWorldRegistry {
  const current = input.registry ?? createRuntimeWorldRegistry();
  const prior = current.worlds[input.worldId];
  const relationshipMap = new Map<string, RuntimeWorldTransitionRelationship>();
  (prior?.transitionRelationships ?? []).forEach((item) => relationshipMap.set(item.toWorldId, item));
  if (input.relationship) relationshipMap.set(input.relationship.toWorldId, input.relationship);
  const nextWorld: RuntimeWorldRegistryEntry = {
    worldId: input.worldId,
    lifecycle: input.lifecycle,
    lastInteractionAt: input.nowIso,
    continuityPressure: clamp01(input.continuityPressure),
    unresolvedOperationalState: clamp01(input.unresolvedOperationalState),
    environmentalIntensity: clamp01(input.environmentalIntensity),
    topologyIntensity: clamp01(input.topologyIntensity),
    activeMissionFocus: input.entityFocus,
    transitionRelationships: [...relationshipMap.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8),
  };

  const worlds = { ...current.worlds, [input.worldId]: nextWorld };
  const entries = Object.values(worlds);
  const foregroundWorldId = entries.find((item) => item.lifecycle === "foreground")?.worldId ?? input.worldId;
  const activeWorldIds = entries.filter((item) => item.lifecycle === "foreground" || item.lifecycle === "active" || item.lifecycle === "background").sort((a, b) => b.lastInteractionAt.localeCompare(a.lastInteractionAt)).map((item) => item.worldId);
  const sleepingWorldIds = entries.filter((item) => item.lifecycle === "sleeping" || item.lifecycle === "suspended").sort((a, b) => b.lastInteractionAt.localeCompare(a.lastInteractionAt)).map((item) => item.worldId);

  return { foregroundWorldId, activeWorldIds, sleepingWorldIds, worlds, updatedAt: input.nowIso };
}
