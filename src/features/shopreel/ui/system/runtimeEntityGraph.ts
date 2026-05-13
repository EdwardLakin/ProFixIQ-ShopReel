import type { RuntimeWorldComposition } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import type { RuntimeWorldPanel } from "@/features/shopreel/ui/system/runtimeWorldPanels";
import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export const RUNTIME_ENTITY_KINDS = [
  "campaign",
  "upload",
  "generation",
  "render",
  "review",
  "publish",
  "analytics",
  "opportunity",
  "script",
  "asset",
  "operator-note",
  "blocker",
  "approval",
] as const;

export type RuntimeEntityKind = (typeof RUNTIME_ENTITY_KINDS)[number];
export type RuntimeEntityLifecycleState = "new" | "active" | "blocked" | "stalled" | "ready" | "resolved" | "failed";
export type RuntimeEntityRelationship = "owns" | "depends_on" | "blocks" | "recovers" | "derived_from" | "upstream" | "downstream" | "arrived_from" | "route_context";
export type RuntimeEntityDependency = { sourceId: string; targetId: string; direction: "upstream" | "downstream"; reason: string; priority: "low" | "medium" | "high" | "critical" };
export type RuntimeEntityBlocker = RuntimeEntityDependency & { blockerId: string; affectedId: string; recoveryEntityId: string | null };
export type RuntimeEntityReference = { id: string; kind: RuntimeEntityKind; worldId: RuntimeWorldId; route: string | null; status: string | null; label: string };
export type RuntimeEntityNode = RuntimeEntityReference & { lifecycleState: RuntimeEntityLifecycleState; metadata: Record<string, string | number | boolean | null> };
export type RuntimeEntityEdge = { id: string; from: string; to: string; relationship: RuntimeEntityRelationship; reason: string; weight: number };
export type RuntimeEntityLineage = { rootId: string | null; chain: string[]; unresolved: string[] };
export type RuntimeEntityContextChain = { arrivedFrom: string | null; previousHop: string | null; sequence: string[]; worldSequence: RuntimeWorldId[] };
export type RuntimeEntityTraversal = { activeId: string | null; upstream: string[]; downstream: string[]; blockers: RuntimeEntityBlocker[]; lastRelationshipHop: string | null };
export type RuntimeEntityGraph = { nodes: RuntimeEntityNode[]; edges: RuntimeEntityEdge[]; relationships: RuntimeEntityEdge[]; dependencies: RuntimeEntityDependency[]; lineage: RuntimeEntityLineage; contextChain: RuntimeEntityContextChain; traversal: RuntimeEntityTraversal };

type BuildInput = {
  activeWorldId: RuntimeWorldId;
  activeRoute: string | null;
  previousWorldId: RuntimeWorldId | null;
  worldTransitionHistory: Array<{ from: RuntimeWorldId | null; to: RuntimeWorldId; at: string; reason: string }>;
  worldSnapshot?: { entityId: string | null; entityKind: string | null; title: string; status: string; href: string } | null;
  continuity: { activeEntityId: string | null; breadcrumbs: Array<{ worldId: RuntimeWorldId; route: string; at: string; label: string }>; activeRoute: string | null };
  composition: RuntimeWorldComposition;
  status: string;
  blockers: string[];
  unresolvedCount: number;
};

function normalizeLifecycleState(status: string, blockers: string[]): RuntimeEntityLifecycleState {
  const s = status.toLowerCase();
  if (blockers.length > 0 || /block|failed|error/.test(s)) return "blocked";
  if (/failed|error/.test(s)) return "failed";
  if (/ready|approved/.test(s)) return "ready";
  if (/resolved|complete|published/.test(s)) return "resolved";
  if (/pending|review/.test(s)) return "stalled";
  return "active";
}

function worldKind(worldId: RuntimeWorldId): RuntimeEntityKind {
  switch (worldId) {
    case "campaign": return "campaign";
    case "upload": return "upload";
    case "generation": return "generation";
    case "render": return "render";
    case "review": return "review";
    case "publish": return "publish";
    case "analytics": return "analytics";
    default: return "operator-note";
  }
}

export function deriveEntityRelationships(nodes: RuntimeEntityNode[], context: BuildInput): RuntimeEntityEdge[] {
  const edges: RuntimeEntityEdge[] = [];
  const active = nodes.find((n) => n.id === context.continuity.activeEntityId) ?? nodes[0] ?? null;
  if (active && context.previousWorldId) {
    const prev = nodes.find((n) => n.worldId === context.previousWorldId);
    if (prev) edges.push({ id: `${prev.id}->${active.id}:arrived_from`, from: prev.id, to: active.id, relationship: "arrived_from", reason: "runtime continuity previous world", weight: 2 });
  }
  for (const panel of context.composition.panels) {
    if (!active) continue;
    edges.push({ id: `${active.id}->panel:${panel.id}`, from: active.id, to: `panel:${panel.id}`, relationship: "route_context", reason: `panel ${panel.title} participates in route context`, weight: 1 });
  }
  return edges;
}

export function deriveEntityDependencies(nodes: RuntimeEntityNode[], context: BuildInput): RuntimeEntityDependency[] {
  const active = nodes[0];
  if (!active) return [];
  const deps: RuntimeEntityDependency[] = [];
  if (context.activeWorldId === "publish") deps.push({ sourceId: "render:runtime", targetId: active.id, direction: "upstream", reason: "publish requires render output", priority: "high" });
  if (context.activeWorldId === "review") deps.push({ sourceId: "approval:runtime", targetId: active.id, direction: "upstream", reason: "review requires approval chain", priority: "high" });
  if (context.activeWorldId === "generation") deps.push({ sourceId: "asset:runtime", targetId: active.id, direction: "upstream", reason: "generation requires assets", priority: "high" });
  if (context.activeWorldId === "render") deps.push({ sourceId: "generation:runtime", targetId: active.id, direction: "upstream", reason: "render requires generation output", priority: "high" });
  return deps;
}

export function deriveEntityLineage(nodes: RuntimeEntityNode[], relationships: RuntimeEntityEdge[]): RuntimeEntityLineage {
  const chain = nodes.map((n) => n.id);
  const unresolved = nodes.filter((n) => n.lifecycleState === "blocked" || n.lifecycleState === "stalled").map((n) => n.id);
  return { rootId: relationships.find((e) => e.relationship === "arrived_from")?.from ?? nodes[0]?.id ?? null, chain, unresolved };
}

export function deriveEntityContextChain(context: BuildInput, nodes: RuntimeEntityNode[]): RuntimeEntityContextChain {
  const sequence = context.worldTransitionHistory.map((t) => `${t.from ?? "deck"}->${t.to}`);
  const worldSequence = context.worldTransitionHistory.map((t) => t.to);
  const previousHop = sequence.at(-1) ?? null;
  const arrivedFrom = nodes.find((n) => n.worldId === context.previousWorldId)?.id ?? null;
  return { arrivedFrom, previousHop, sequence, worldSequence };
}

export function deriveUpstreamRelationships(entityId: string, dependencies: RuntimeEntityDependency[]): string[] {
  return dependencies.filter((d) => d.targetId === entityId && d.direction === "upstream").map((d) => d.sourceId);
}

export function deriveDownstreamRelationships(entityId: string, dependencies: RuntimeEntityDependency[]): string[] {
  return dependencies.filter((d) => d.sourceId === entityId && d.direction === "downstream").map((d) => d.targetId);
}

export function deriveBlockingRelationships(context: BuildInput, dependencies: RuntimeEntityDependency[]): RuntimeEntityBlocker[] {
  if (context.blockers.length === 0) return [];
  const primary = dependencies[0];
  return context.blockers.map((label, index) => ({
    sourceId: primary?.sourceId ?? `blocker:${index}`,
    targetId: primary?.targetId ?? `${context.activeWorldId}:runtime`,
    direction: "upstream",
    reason: label,
    priority: /failed|error/.test(label.toLowerCase()) ? "critical" : "high",
    blockerId: `blocker:${context.activeWorldId}:${index}`,
    affectedId: primary?.targetId ?? `${context.activeWorldId}:runtime`,
    recoveryEntityId: context.activeWorldId === "publish" ? "review:runtime" : context.activeWorldId === "render" ? "generation:runtime" : null,
  }));
}

export function deriveEntityTraversal(graph: { nodes: RuntimeEntityNode[]; dependencies: RuntimeEntityDependency[]; blockers: RuntimeEntityBlocker[]; contextChain: RuntimeEntityContextChain }): RuntimeEntityTraversal {
  const activeId = graph.nodes[0]?.id ?? null;
  return {
    activeId,
    upstream: activeId ? deriveUpstreamRelationships(activeId, graph.dependencies) : [],
    downstream: activeId ? deriveDownstreamRelationships(activeId, graph.dependencies) : [],
    blockers: graph.blockers,
    lastRelationshipHop: graph.contextChain.previousHop,
  };
}

export function buildRuntimeEntityGraph(input: BuildInput): RuntimeEntityGraph {
  const activeNode: RuntimeEntityNode = {
    id: input.worldSnapshot?.entityId ?? `${input.activeWorldId}:runtime`,
    kind: worldKind(input.activeWorldId),
    worldId: input.activeWorldId,
    route: input.activeRoute,
    status: input.worldSnapshot?.status ?? input.status,
    label: input.worldSnapshot?.title ?? `${input.activeWorldId} runtime`,
    lifecycleState: normalizeLifecycleState(input.status, input.blockers),
    metadata: { unresolvedCount: input.unresolvedCount, hasBlockers: input.blockers.length > 0 },
  };
  const previousNode = input.previousWorldId ? {
    id: `${input.previousWorldId}:runtime`, kind: worldKind(input.previousWorldId), worldId: input.previousWorldId, route: null, status: null, label: `${input.previousWorldId} context`, lifecycleState: "active", metadata: {},
  } satisfies RuntimeEntityNode : null;

  const nodes = [activeNode, ...(previousNode ? [previousNode] : [])];
  const relationships = deriveEntityRelationships(nodes, input);
  const dependencies = deriveEntityDependencies(nodes, input);
  const blockers = deriveBlockingRelationships(input, dependencies);
  const dependencyEdges: RuntimeEntityEdge[] = dependencies.map((d, idx) => ({ id: `dep:${idx}:${d.sourceId}->${d.targetId}`, from: d.sourceId, to: d.targetId, relationship: "depends_on", reason: d.reason, weight: d.priority === "critical" ? 4 : d.priority === "high" ? 3 : 2 }));
  const blockerEdges: RuntimeEntityEdge[] = blockers.map((b) => ({ id: `${b.blockerId}:${b.sourceId}->${b.targetId}`, from: b.sourceId, to: b.targetId, relationship: "blocks", reason: b.reason, weight: b.priority === "critical" ? 4 : 3 }));
  const edges = [...relationships, ...dependencyEdges, ...blockerEdges];
  const contextChain = deriveEntityContextChain(input, nodes);
  const lineage = deriveEntityLineage(nodes, edges);
  const traversal = deriveEntityTraversal({ nodes, dependencies, blockers, contextChain });
  return { nodes, edges, relationships: edges, dependencies, lineage, contextChain, traversal };
}
