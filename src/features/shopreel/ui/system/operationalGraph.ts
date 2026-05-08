import type { AiIntent } from "@/features/shopreel/ui/system/AiCommandPrimitives";

export type OperationalNodeType =
  | "campaign"
  | "generation"
  | "variant"
  | "storyboard"
  | "scene"
  | "media_asset"
  | "voiceover"
  | "render"
  | "export_package"
  | "publication"
  | "continuity_thread";

export type OperationalEdgeType =
  | "lineage"
  | "ancestry"
  | "derivation"
  | "continuity"
  | "dependency"
  | "recovery"
  | "readiness";

export type OperationalNode = {
  id: string;
  type: OperationalNodeType;
  label: string;
  route: string;
  status: "ready" | "active" | "blocked" | "interrupted" | "partial";
  updatedAt: string;
};

export type OperationalEdge = {
  from: string;
  to: string;
  type: OperationalEdgeType;
  explainability: string;
};

export type OperationalGraph = {
  nodes: OperationalNode[];
  edges: OperationalEdge[];
  activeChain: string[];
  continuityPressure: number;
  readinessPropagation: number;
  recoveryCandidates: string[];
  explainability: string[];
  worldZones: WorldZone[];
  gravityFields: ProductionGravityField[];
};

export type WorldZoneKind =
  | "active_operational_zone"
  | "dormant_zone"
  | "unstable_branch"
  | "escalating_chain"
  | "continuity_fracture"
  | "momentum_corridor"
  | "recovery_region"
  | "export_pressure_region"
  | "publication_staging_region";

export type WorldZone = {
  id: string;
  label: string;
  kind: WorldZoneKind;
  nodeIds: string[];
  density: number;
  momentum: number;
  stability: number;
};

export type ProductionGravityField = {
  id: string;
  label: string;
  trigger: string;
  intensity: number;
  focusNodeIds: string[];
};

export type CommandExecutionPlan = {
  intent: AiIntent;
  focusNodeId?: string;
  targetRoute: string;
  mode:
    | "continue_export_recovery"
    | "open_render_blockers"
    | "resume_interrupted_campaign"
    | "show_unstable_variants"
    | "focus_export_ready_assets"
    | "open_continuity_critical_paths"
    | "continue_latest_storyboard"
    | "show_weak_scene_pacing"
    | "open_blocked_render_chain"
    | "default";
  explainability: string[];
};

const score = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function buildOperationalGraph(input: {
  generationId?: string;
  campaignId?: string;
  pendingTaskCount: number;
  blockerCount: number;
  readyTaskCount: number;
  interrupted: boolean;
  continuityThreadCount: number;
  lastRoute: string;
}): OperationalGraph {
  const now = new Date().toISOString();
  const campaignId = input.campaignId ?? "campaign-root";
  const generationId = input.generationId ?? "generation-latest";

  const nodes: OperationalNode[] = [
    { id: campaignId, type: "campaign", label: "Campaign branch", route: `/shopreel/campaigns/${campaignId}`, status: input.interrupted ? "interrupted" : "active", updatedAt: now },
    { id: generationId, type: "generation", label: "Latest generation", route: `/shopreel/generations/${generationId}`, status: "active", updatedAt: now },
    { id: `${generationId}-variant`, type: "variant", label: "Primary variant", route: `/shopreel/generations/${generationId}`, status: input.blockerCount > 0 ? "partial" : "ready", updatedAt: now },
    { id: `${generationId}-storyboard`, type: "storyboard", label: "Storyboard branch", route: `/shopreel/editor`, status: "active", updatedAt: now },
    { id: `${generationId}-scene`, type: "scene", label: "Scene topology", route: `/shopreel/editor`, status: input.blockerCount > 1 ? "blocked" : "active", updatedAt: now },
    { id: `${generationId}-asset`, type: "media_asset", label: "Media support", route: `/shopreel/library`, status: input.readyTaskCount > 0 ? "ready" : "partial", updatedAt: now },
    { id: `${generationId}-voiceover`, type: "voiceover", label: "Voiceover lane", route: `/shopreel/editor`, status: "partial", updatedAt: now },
    { id: `${generationId}-render`, type: "render", label: "Render chain", route: `/shopreel/render-queue`, status: input.blockerCount > 0 ? "blocked" : "active", updatedAt: now },
    { id: `${generationId}-export`, type: "export_package", label: "Export package", route: `/shopreel/exports`, status: input.readyTaskCount > 0 ? "active" : "partial", updatedAt: now },
    { id: `${generationId}-publication`, type: "publication", label: "Publication staging", route: `/shopreel/publish-queue`, status: input.readyTaskCount > 1 ? "ready" : "partial", updatedAt: now },
    { id: `${generationId}-continuity`, type: "continuity_thread", label: "Continuity thread", route: input.lastRoute || `/shopreel/generations/${generationId}`, status: input.interrupted ? "interrupted" : "active", updatedAt: now },
  ];

  const edges: OperationalEdge[] = [
    { from: campaignId, to: generationId, type: "lineage", explainability: "Generation derives from campaign branch." },
    { from: generationId, to: `${generationId}-variant`, type: "derivation", explainability: "Variant derives from generation." },
    { from: `${generationId}-variant`, to: `${generationId}-storyboard`, type: "lineage", explainability: "Storyboard branch derives from variant." },
    { from: `${generationId}-storyboard`, to: `${generationId}-scene`, type: "ancestry", explainability: "Scenes inherit storyboard intent." },
    { from: `${generationId}-scene`, to: `${generationId}-asset`, type: "dependency", explainability: "Scene support depends on assets." },
    { from: `${generationId}-scene`, to: `${generationId}-voiceover`, type: "dependency", explainability: "Scene pacing depends on voiceover." },
    { from: `${generationId}-scene`, to: `${generationId}-render`, type: "dependency", explainability: "Render depends on scene stability." },
    { from: `${generationId}-render`, to: `${generationId}-export`, type: "derivation", explainability: "Export package derives from render output." },
    { from: `${generationId}-export`, to: `${generationId}-publication`, type: "derivation", explainability: "Publication derives from export package." },
    { from: `${generationId}-continuity`, to: `${generationId}-render`, type: "recovery", explainability: "Continuity thread recovers interrupted render chains." },
    { from: `${generationId}-continuity`, to: `${generationId}-publication`, type: "continuity", explainability: "Continuity protects publish flow context." },
    { from: `${generationId}-asset`, to: `${generationId}-render`, type: "readiness", explainability: "Asset readiness propagates to render readiness." },
  ];

  return {
    nodes,
    edges,
    activeChain: [campaignId, generationId, `${generationId}-storyboard`, `${generationId}-scene`, `${generationId}-render`, `${generationId}-export`, `${generationId}-publication`],
    continuityPressure: score((input.continuityThreadCount * 18) + (input.interrupted ? 20 : 0) + (input.blockerCount * 14)),
    readinessPropagation: score((input.readyTaskCount * 22) - (input.blockerCount * 12) + (input.pendingTaskCount * 8)),
    recoveryCandidates: input.interrupted ? [`${generationId}-continuity`, `${generationId}-render`, campaignId] : [`${generationId}-render`],
    explainability: [
      "Graph is deterministic, local-first, and computed from workspace context.",
      "Lineage chain maps campaign → generation → variant → storyboard → scene → render → export → publication.",
      "Recovery lineage is anchored by continuity threads.",
    ],
    worldZones: [
      { id: "active-core", label: "Active operational core", kind: "active_operational_zone", nodeIds: [campaignId, generationId, `${generationId}-storyboard`], density: score(55 + input.pendingTaskCount * 7), momentum: score(60 + input.readyTaskCount * 10), stability: score(62 - input.blockerCount * 8) },
      { id: "unstable-render", label: "Render instability valley", kind: input.blockerCount > 0 ? "unstable_branch" : "momentum_corridor", nodeIds: [`${generationId}-scene`, `${generationId}-render`], density: score(45 + input.blockerCount * 15), momentum: score(42 + input.readyTaskCount * 8), stability: score(78 - input.blockerCount * 20) },
      { id: "recovery-ridge", label: "Recovery ridge", kind: input.interrupted ? "recovery_region" : "dormant_zone", nodeIds: [`${generationId}-continuity`, campaignId], density: score(35 + input.continuityThreadCount * 10), momentum: score(38 + (input.interrupted ? 26 : 6)), stability: score(84 - (input.interrupted ? 30 : 0)) },
      { id: "export-front", label: "Export pressure front", kind: input.readyTaskCount > 0 ? "export_pressure_region" : "publication_staging_region", nodeIds: [`${generationId}-export`, `${generationId}-publication`], density: score(40 + input.readyTaskCount * 16), momentum: score(48 + input.readyTaskCount * 14), stability: score(66 - input.blockerCount * 8) },
    ],
    gravityFields: [
      { id: "render-instability", label: "Render instability attraction", trigger: "blocked render chain", intensity: score(input.blockerCount * 28 + (input.interrupted ? 18 : 0)), focusNodeIds: [`${generationId}-render`, `${generationId}-scene`] },
      { id: "continuity-fracture", label: "Continuity fracture density", trigger: "interrupted continuity", intensity: score((input.interrupted ? 55 : 15) + input.continuityThreadCount * 9), focusNodeIds: [`${generationId}-continuity`, `${generationId}-publication`] },
      { id: "publication-momentum", label: "Publication momentum pull", trigger: "export/package readiness", intensity: score(input.readyTaskCount * 24 - input.blockerCount * 10), focusNodeIds: [`${generationId}-export`, `${generationId}-publication`] },
    ],
  };
}

export function planCommandExecution(command: string, graph: OperationalGraph, fallbackRoute: string, intent: AiIntent): CommandExecutionPlan {
  const q = command.toLowerCase();
  const byId = (id: string) => graph.nodes.find((node) => node.id === id);
  const renderNode = graph.nodes.find((node) => node.type === "render");
  const exportNode = graph.nodes.find((node) => node.type === "export_package");
  const continuityNode = graph.nodes.find((node) => node.type === "continuity_thread");
  const storyboardNode = graph.nodes.find((node) => node.type === "storyboard");
  const variantNode = graph.nodes.find((node) => node.type === "variant");

  const routeFrom = (node?: OperationalNode) => node?.route ?? fallbackRoute;

  if (/continue export recovery|abandoned export|resume export/.test(q)) return { intent, focusNodeId: exportNode?.id, targetRoute: routeFrom(exportNode), mode: "continue_export_recovery", explainability: ["Intent mapped to export recovery lineage."] };
  if (/open render blockers|blocked render|render blockers/.test(q)) return { intent, focusNodeId: renderNode?.id, targetRoute: "/shopreel/render-queue", mode: "open_render_blockers", explainability: ["Intent mapped to blocked render topology."] };
  if (/resume interrupted campaign|restore interrupted branch/.test(q)) return { intent, focusNodeId: graph.activeChain[0], targetRoute: routeFrom(byId(graph.activeChain[0])), mode: "resume_interrupted_campaign", explainability: ["Intent mapped to campaign recovery lineage."] };
  if (/unstable variants|weak variants/.test(q)) return { intent, focusNodeId: variantNode?.id, targetRoute: "/shopreel/editor", mode: "show_unstable_variants", explainability: ["Intent mapped to variant branching stability."] };
  if (/focus export-ready assets|export-ready assets/.test(q)) return { intent, focusNodeId: exportNode?.id, targetRoute: "/shopreel/exports", mode: "focus_export_ready_assets", explainability: ["Intent mapped to export readiness propagation."] };
  if (/continuity-critical paths|highest continuity pressure/.test(q)) return { intent, focusNodeId: continuityNode?.id, targetRoute: routeFrom(continuityNode), mode: "open_continuity_critical_paths", explainability: ["Intent mapped to continuity pressure in operational graph."] };
  if (/continue latest storyboard/.test(q)) return { intent, focusNodeId: storyboardNode?.id, targetRoute: routeFrom(storyboardNode), mode: "continue_latest_storyboard", explainability: ["Intent mapped to storyboard lineage." ] };
  if (/weak scene pacing/.test(q)) return { intent, focusNodeId: graph.nodes.find((n) => n.type === "scene")?.id, targetRoute: "/shopreel/editor", mode: "show_weak_scene_pacing", explainability: ["Intent mapped to scene + voiceover dependency."] };
  if (/blocked render chain/.test(q)) return { intent, focusNodeId: renderNode?.id, targetRoute: "/shopreel/render-queue", mode: "open_blocked_render_chain", explainability: ["Intent mapped to render dependency chain."] };
  if (/stabilize unstable branch|isolate fractured lineage/.test(q)) return { intent, focusNodeId: renderNode?.id, targetRoute: "/shopreel/render-queue", mode: "open_render_blockers", explainability: ["Structural command mapped to unstable branch stabilization."] };
  if (/restore export momentum|focus render pressure region/.test(q)) return { intent, focusNodeId: exportNode?.id, targetRoute: "/shopreel/exports", mode: "focus_export_ready_assets", explainability: ["Structural command mapped to export momentum field."] };
  if (/reopen continuity corridor|elevate dormant recovery path|continue production frontier/.test(q)) return { intent, focusNodeId: continuityNode?.id, targetRoute: routeFrom(continuityNode), mode: "open_continuity_critical_paths", explainability: ["Structural command mapped to continuity terrain corridors."] };

  return { intent, targetRoute: fallbackRoute, mode: "default", explainability: ["Used default deterministic command plan."] };
}
