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
  dimensionalLayers: DimensionalLayer[];
  continuityFlow: ContinuityFlowPhysics;
  structuralReactivity: StructuralReactivityState;
  memoryResidue: WorldMemoryResidue;
  attentionOrchestration: AutonomousAttentionOrchestration;
  temporalCinematography: TemporalCinematographyEngine;
  operationalFields: OperationalField[];
  multiFocusState: MultiFocusAwarenessState;
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
    dimensionalLayers: [
      { key: "surface_layer", density: score(40 + input.pendingTaskCount * 8), compression: score(30 + input.blockerCount * 10), focus: score(58 + input.readyTaskCount * 8), motion: score(46 + input.readyTaskCount * 7), urgency: score(52 + input.blockerCount * 12), visibility: score(80 - input.blockerCount * 8), influence: "Operator-visible command surface." },
      { key: "operational_layer", density: score(55 + input.pendingTaskCount * 10), compression: score(45 + input.blockerCount * 10), focus: score(64 + input.readyTaskCount * 8), motion: score(58 + input.pendingTaskCount * 6), urgency: score(62 + input.blockerCount * 10), visibility: score(74 - input.blockerCount * 6), influence: "Task pressure topology." },
      { key: "continuity_layer", density: score(42 + input.continuityThreadCount * 11), compression: score(38 + (input.interrupted ? 20 : 0)), focus: score(72 + input.continuityThreadCount * 6), motion: score(56 + input.continuityThreadCount * 7), urgency: score(50 + (input.interrupted ? 20 : 0)), visibility: score(70 + input.continuityThreadCount * 4), influence: "Continuity current rails." },
      { key: "memory_layer", density: score(30 + input.pendingTaskCount * 7), compression: score(40 + input.blockerCount * 12), focus: score(54 + input.blockerCount * 8), motion: score(32 + input.readyTaskCount * 6), urgency: score(44 + input.blockerCount * 9), visibility: score(60), influence: "Operational residue and imprint." },
      { key: "lineage_layer", density: score(50 + input.readyTaskCount * 7), compression: score(34 + input.pendingTaskCount * 8), focus: score(66 + input.readyTaskCount * 9), motion: score(44 + input.readyTaskCount * 7), urgency: score(48 + input.blockerCount * 8), visibility: score(68), influence: "Derivation and ancestry structure." },
      { key: "recovery_layer", density: score(36 + input.continuityThreadCount * 9), compression: score(26 + (input.interrupted ? 28 : 8)), focus: score(64 + (input.interrupted ? 20 : 0)), motion: score(40 + input.continuityThreadCount * 6), urgency: score(46 + (input.interrupted ? 25 : 0)), visibility: score(76 - input.blockerCount * 4), influence: "Stabilization and restoration corridors." },
      { key: "cinematic_layer", density: score(48 + input.blockerCount * 9), compression: score(42 + input.pendingTaskCount * 8), focus: score(70 + input.readyTaskCount * 7), motion: score(60 + input.readyTaskCount * 8), urgency: score(58 + input.blockerCount * 11), visibility: score(72), influence: "Pacing and atmospheric focus." },
    ],
    continuityFlow: { continuityCurrent: score(50 + input.continuityThreadCount * 11), momentumStream: score(48 + input.readyTaskCount * 14), instabilityTurbulence: score(22 + input.blockerCount * 23), recoveryDrift: score(30 + (input.interrupted ? 40 : 8)), exportFlowPressure: score(40 + input.readyTaskCount * 18), publicationAcceleration: score(36 + input.readyTaskCount * 16), dormantStagnation: score(34 + input.pendingTaskCount * 10 - input.readyTaskCount * 6), renderTurbulence: score(26 + input.blockerCount * 21), explainability: ["Continuity flows deterministically from continuity threads and blockers.", "Export and publication acceleration are local readiness gradients."] },
    structuralReactivity: { environmentalDensity: score(44 + input.blockerCount * 16 + input.pendingTaskCount * 9), topologyDistortion: score(24 + input.blockerCount * 24), pacingIntensity: score(42 + input.readyTaskCount * 13 + input.blockerCount * 9), dormantCooling: score(64 + input.pendingTaskCount * 4 - input.readyTaskCount * 8), recoveryGradient: score(40 + (input.interrupted ? 28 : 8) + input.continuityThreadCount * 6), coherenceIntegrity: score(84 - input.blockerCount * 16 + input.readyTaskCount * 6), explainability: ["Reactivity mirrors true blockers and readiness propagation."] },
    memoryResidue: { continuityScars: score(20 + input.continuityThreadCount * 12 + (input.interrupted ? 18 : 0)), instabilityEchoes: score(18 + input.blockerCount * 20), recoveryWarmth: score(30 + input.readyTaskCount * 14), dormantSediment: score(28 + input.pendingTaskCount * 10), bottleneckTrails: score(26 + input.blockerCount * 18), operationalErosion: score(24 + input.pendingTaskCount * 11 + input.blockerCount * 9), frictionResidue: score(18 + input.blockerCount * 24), momentumImprint: score(34 + input.readyTaskCount * 16), explainability: ["Residue encodes prior operational events in reversible local memory."] },
    attentionOrchestration: { instabilityPull: score(30 + input.blockerCount * 22), staleZoneDimming: score(34 + input.pendingTaskCount * 10 - input.readyTaskCount * 5), continuityAnchorPreservation: score(56 + input.continuityThreadCount * 8), pressureCorridorWidth: score(40 + input.pendingTaskCount * 12), dormantBranchNarrowing: score(38 + input.pendingTaskCount * 10 - input.readyTaskCount * 6), activeFrontElevation: score(46 + input.readyTaskCount * 14), stableRegionSoftening: score(62 + input.readyTaskCount * 9 - input.blockerCount * 8), explainability: ["Attention orchestration reshapes environment without alerts or assistants."] },
    temporalCinematography: { pacingAcceleration: score(38 + input.readyTaskCount * 14 + input.blockerCount * 10), breathingCycle: score(72 - input.blockerCount * 12), tensionBuildup: score(34 + input.blockerCount * 21), recoveryCooling: score(40 + (input.interrupted ? 25 : 8)), restorationWarmth: score(44 + input.continuityThreadCount * 10 + input.readyTaskCount * 7), saturationCollapse: score(28 + input.pendingTaskCount * 12), escalationSurge: score(30 + input.blockerCount * 20), exportUrgencyCrescendo: score(38 + input.readyTaskCount * 18), explainability: ["Temporal atmosphere evolves from deterministic lifecycle metrics."] },
    operationalFields: [
      { id: "continuity", kind: "continuity_field", strength: score(48 + input.continuityThreadCount * 12), affectedNodeIds: [`${generationId}-continuity`, `${generationId}-scene`], explainability: "Maintains continuity openness across active rails." },
      { id: "momentum", kind: "momentum_field", strength: score(46 + input.readyTaskCount * 14), affectedNodeIds: [`${generationId}-render`, `${generationId}-export`], explainability: "Pushes ready branches toward packaging." },
      { id: "readiness", kind: "readiness_field", strength: score(40 + input.readyTaskCount * 16 - input.blockerCount * 8), affectedNodeIds: [`${generationId}-asset`, `${generationId}-publication`], explainability: "Readiness pressure for publication frontier." },
      { id: "export-inevitability", kind: "export_inevitability_field", strength: score(34 + input.readyTaskCount * 18), affectedNodeIds: [`${generationId}-export`, `${generationId}-publication`], explainability: "Export inevitability ramps with completion." },
    ],
    multiFocusState: { activeRenderFront: score(38 + input.blockerCount * 18 + input.readyTaskCount * 8), exportEscalationRegion: score(40 + input.readyTaskCount * 16), continuityRecoveryCorridor: score(44 + input.continuityThreadCount * 12 + (input.interrupted ? 12 : 0)), dormantCampaignBasin: score(42 + input.pendingTaskCount * 10 - input.readyTaskCount * 6), publicationStagingFrontier: score(36 + input.readyTaskCount * 15), balanceIndex: score(70 - input.blockerCount * 12 + input.readyTaskCount * 7), explainability: ["Multi-focus awareness balances simultaneous operational fronts."] },
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


export type DimensionalLayerKey = "surface_layer"|"operational_layer"|"continuity_layer"|"memory_layer"|"lineage_layer"|"recovery_layer"|"cinematic_layer";
export type DimensionalLayer = { key: DimensionalLayerKey; density:number; compression:number; focus:number; motion:number; urgency:number; visibility:number; influence:string; };
export type ContinuityFlowPhysics = { continuityCurrent:number; momentumStream:number; instabilityTurbulence:number; recoveryDrift:number; exportFlowPressure:number; publicationAcceleration:number; dormantStagnation:number; renderTurbulence:number; explainability:string[]; };
export type StructuralReactivityState = { environmentalDensity:number; topologyDistortion:number; pacingIntensity:number; dormantCooling:number; recoveryGradient:number; coherenceIntegrity:number; explainability:string[]; };
export type WorldMemoryResidue = { continuityScars:number; instabilityEchoes:number; recoveryWarmth:number; dormantSediment:number; bottleneckTrails:number; operationalErosion:number; frictionResidue:number; momentumImprint:number; explainability:string[]; };
export type AutonomousAttentionOrchestration = { instabilityPull:number; staleZoneDimming:number; continuityAnchorPreservation:number; pressureCorridorWidth:number; dormantBranchNarrowing:number; activeFrontElevation:number; stableRegionSoftening:number; explainability:string[]; };
export type TemporalCinematographyEngine = { pacingAcceleration:number; breathingCycle:number; tensionBuildup:number; recoveryCooling:number; restorationWarmth:number; saturationCollapse:number; escalationSurge:number; exportUrgencyCrescendo:number; explainability:string[]; };
export type OperationalField = { id:string; kind:"continuity_field"|"momentum_field"|"readiness_field"|"export_inevitability_field"|"render_turbulence_field"|"recovery_harmonics"|"cinematic_pull_field"|"topology_stabilization_field"; strength:number; affectedNodeIds:string[]; explainability:string; };
export type MultiFocusAwarenessState = { activeRenderFront:number; exportEscalationRegion:number; continuityRecoveryCorridor:number; dormantCampaignBasin:number; publicationStagingFrontier:number; balanceIndex:number; explainability:string[]; };
