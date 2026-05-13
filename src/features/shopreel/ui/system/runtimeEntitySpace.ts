import type { RuntimeEmbodiedState } from "@/features/shopreel/ui/system/runtimeEmbodiment";
import type { RuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";

export type RuntimeEntityKind = "campaign" | "generation" | "upload" | "render" | "review" | "approval" | "operator_memory" | "temporal_artifact" | "blocker" | "workflow" | "command";
export type RuntimeEntityPresence = "active" | "latent" | "blocked" | "resolved";
export type RuntimeEntitySpatialCluster = "focal" | "support" | "peripheral" | "background";
export type RuntimeEntityPresenceBand = "immediate" | "near" | "ambient" | "distant";
export type RuntimeEntityAttentionWeight = { priority: number; urgency: number; confidence: number; focusPull: number };
export type RuntimeEntityContinuity = { familiar: boolean; returnPathWeight: number; continuityShift: number };
export type RuntimeEntityTemporalState = { lastActiveAt: string | null; driftWindowMs: number; decay: number };
export type RuntimeEntityField = { cluster: RuntimeEntitySpatialCluster; band: RuntimeEntityPresenceBand; chamberInfluence: number; traversalInfluence: number };
export type RuntimeEntityPresenceField = { attentionPull: number; chamberPressure: number; environmentalDensity: number; traversalVectorInfluence: number };
export type RuntimeEntityLifecycle = { state: "active" | "stalled" | "recovering" | "resolved"; continuityAgeMs: number };
export type RuntimeEntityDrift = { vector: { x: number; y: number; z: number }; driftWeight: number };
export type RuntimeEntityAttentionGravity = { pull: number; reason: "urgency" | "workload" | "continuity" | "unknown" };
export type RuntimeEntityPressureContribution = { pressure: number; source: "render_queue" | "approval_queue" | "generation_cluster" | "workflow_overload" | "unknown" };
export type RuntimeEntityContinuityAnchor = { anchorWorldId: string; familiarity: number; returnBias: number };
export type RuntimeEntityClusterField = { clusterId: string; cohesion: number; intensity: number };
export type RuntimeEntityPosition = { plane: "foreground" | "midground" | "operator" | "peripheral" | "background"; x: number; y: number; z: number };
export type RuntimeEntityRelationship = { targetId: string; relation: "depends_on" | "supports" | "blocks" | "recovers" };
export type RuntimeEntityActionSurface = { mode: "focal" | "supporting" | "background" | "operator_guided" | "escape"; href: string | null; label: string };
export type RuntimeEntity = { id: string; kind: RuntimeEntityKind; title: string; presence: RuntimeEntityPresence; position: RuntimeEntityPosition; weight: RuntimeEntityAttentionWeight; continuity: RuntimeEntityContinuity; temporal: RuntimeEntityTemporalState; field: RuntimeEntityField; relationships: RuntimeEntityRelationship[]; actionSurface: RuntimeEntityActionSurface | null };

export type RuntimeEntityMaterialization = {
  entityPressure: number;
  entityClusterWeight: number;
  entityDrift: number;
  entityPresenceBand: RuntimeEntityPresenceBand;
  relationshipTension: number;
  actionSurfaceGravity: number;
  topologyResonance: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function deriveRuntimeEntityMaterialization(input: { graph: RuntimeEntityGraph; embodied: RuntimeEmbodiedState }): RuntimeEntityMaterialization {
  const activeCount = input.graph.nodes.filter((node) => node.lifecycleState === "active" || node.lifecycleState === "blocked").length;
  const blockerCount = input.graph.traversal.blockers.length;
  const relationshipCount = input.graph.relationships.length;
  const dependencyCount = input.graph.dependencies.length;
  const focalActionCount = input.graph.nodes.filter((node) => Boolean(node.route)).length;

  const entityPressure = clamp(input.embodied.continuityPressure * 0.5 + Math.min(1, blockerCount / 4) * 0.3 + Math.min(1, activeCount / 6) * 0.2);
  const entityClusterWeight = clamp(Math.min(1, relationshipCount / 8) * 0.45 + Math.min(1, dependencyCount / 6) * 0.25 + input.embodied.chamberDensity * 0.3);
  const entityDrift = clamp((1 - input.embodied.environmentalStabilization) * 0.5 + input.embodied.operationalDrift * 0.5);
  const relationshipTension = clamp(Math.min(1, blockerCount / Math.max(1, dependencyCount)) * 0.55 + input.embodied.fragmentation * 0.45);
  const actionSurfaceGravity = clamp(Math.min(1, focalActionCount / 5) * 0.45 + input.embodied.focalEmergence * 0.55);

  const entityPresenceBand: RuntimeEntityPresenceBand = entityPressure > 0.72 ? "immediate" : entityPressure > 0.52 ? "near" : entityPressure > 0.3 ? "ambient" : "distant";

  const topologyResonance = clamp(actionSurfaceGravity * 0.6 + entityClusterWeight * 0.4);
  return { entityPressure, entityClusterWeight, entityDrift, entityPresenceBand, relationshipTension, actionSurfaceGravity, topologyResonance };
}
