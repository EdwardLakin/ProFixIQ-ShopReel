"use client";

import type { AiIntent } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import type { CommandExecutionPlan, OperationalGraph } from "@/features/shopreel/ui/system/operationalGraph";

export type WorkspaceTask = {
  id: string;
  label: string;
  route: string;
  done: boolean;
};

export type WorkspaceMemory = {
  lastWorkflow: AiIntent;
  lastCampaignId?: string;
  lastRenderContextRoute?: string;
  lastGenerationId?: string;
  lastCommand: string;
  lastRoute: string;
  recentIntents: AiIntent[];
  intentHistory: string[];
  pendingTasks: WorkspaceTask[];
  interruptedWorkflow?: AiIntent;
  adaptiveMode?: "render" | "campaign" | "packaging" | "scene" | "publish" | "variant" | "balanced";
  creativeContinuity?: CreativeContinuityMemory;
  continuityThreads?: ContinuityThread[];
  intentSignals?: CreativeIntentSignals;
  ecosystemState?: EcosystemState;
  productionConsciousness?: ProductionConsciousnessState;
  operationalGraph?: OperationalGraph;
  lastExecutionPlan?: CommandExecutionPlan;
  worldState?: PersistentWorldState;
  updatedAt: string;
};
export type PersistentWorldState = {
  operationalAging: number;
  continuityDecay: number;
  momentumAcceleration: number;
  renderCooling: number;
  exportUrgencyGrowth: number;
  recoveryHalfLife: number;
  dormantRestorationWarmth: number;
  escalationWindow: number;
  autonomousStabilizationActions: string[];
  topologyDepth: {
    nearFieldFocus: number;
    midFieldContinuity: number;
    farFieldTopology: number;
    deepLineageBackground: number;
  };
  cinematography: {
    pacing: number;
    urgency: number;
    calm: number;
    friction: number;
    readiness: number;
    saturation: number;
    compression: number;
  };
  memoryEvolution: {
    continuityScars: number;
    operationalResidue: number;
    recurringInstability: number;
    recoverySuccessMemory: number;
    bottleneckMemory: number;
  };
};
export type TemporalRailState = "active_now" | "recent" | "stale" | "archived" | "interrupted" | "resumed" | "escalating";

export type EcosystemState = {
  operationalSaturation: number;
  interruptionPressure: number;
  continuityImportance: number;
  activeProductionLoad: number;
  exportReadinessPressure: number;
  renderUrgency: number;
  unresolvedBlockerWeight: number;
  focusEntropy: number;
  telemetryDensityPressure: number;
  temporalRailState: TemporalRailState;
  environmentalEnergy: "calm_idle" | "active_production" | "render_tension" | "export_momentum" | "blocker_friction" | "campaign_intensity";
  explainability: string[];
};

export type ContinuityThreadKind = "active_workflow" | "recovery" | "render_continuation" | "scene_path" | "export_lineage" | "campaign_evolution";

export type ContinuityThread = {
  id: string;
  kind: ContinuityThreadKind;
  label: string;
  route: string;
  status: "active" | "interrupted" | "resolved";
  priority: number;
  updatedAt: string;
};

export type CreativeIntentSignals = {
  pacingBias: "accelerated" | "balanced" | "cinematic";
  ctaBias: "direct" | "story-led" | "community-led";
  hookDensityBias: "high" | "moderate" | "low";
  exportStyleBias: "speed" | "balanced" | "craft";
  variantDirectionBias: "parallel" | "iterative" | "single";
  explainability: string[];
};

export type CreativeContinuityMemory = {
  pacingPreference: "high_energy" | "steady" | "cinematic";
  tonePreference: "founder_story" | "commercial_clean" | "direct_response";
  hookStyle: "pattern_break" | "narrative" | "problem_first";
  ctaStyle: "direct" | "soft" | "community";
  visualEnergy: "kinetic" | "balanced" | "minimal";
  editingRhythm: "rapid" | "mixed" | "longform";
  captionDensity: "light" | "medium" | "dense";
  platformBias: "tiktok" | "instagram" | "youtube_shorts";
  variantPreference: "single_best" | "parallel_variants" | "iterative_branching";
  structurePattern: "hook-proof-cta" | "problem-solution-cta" | "story-payoff-cta";
};



export type ProductionEmotionalState = "calm_continuity" | "orchestration_tension" | "render_momentum" | "export_anticipation" | "blocker_friction" | "recovery_stabilization" | "active_production_energy";

export type CinematicOrchestrationState = {
  emotionalState: ProductionEmotionalState;
  atmosphericDensity: number;
  motionPacing: "slow_breathing" | "steady" | "momentum" | "surge";
  luminanceBias: "cool" | "neutral" | "warm" | "high_contrast";
  depthFocus: "background" | "balanced" | "foreground";
  compressionLevel: "open" | "balanced" | "focused" | "compressed";
  restorationMomentum: number;
  continuityWarmth: number;
  explainability: string[];
};



export type ProductionConsciousnessState = {
  operationalAwareness: number;
  continuityAwareness: number;
  momentumAwareness: number;
  frictionAwareness: number;
  creativeCoherenceAwareness: number;
  stagingConfidence: number;
  recoveryProbability: number;
  interruptionSensitivity: number;
  productionSaturation: number;
  exportGravity: number;
  renderVolatility: number;
  attentionEconomy: AttentionEconomyState;
  creativeDrift: CreativeDriftSignals;
  recoveryIntelligence: RecoveryIntelligenceState;
  operationalTension: OperationalTensionState;
  momentumField: MomentumFieldState;
  memoryDepth: EnvironmentalMemoryDepthState;
  cinematicPrioritization: CinematicPrioritizationState;
  selfSteeringTopology: SelfSteeringTopologyState;
  explainability: string[];
};

export type AttentionEconomyState = {
  continuityRailResistance: number;
  staleTelemetryDecay: number;
  blockerPressure: number;
  renderLuminancePreservation: number;
  exportFocusShare: number;
  recedingNoisePressure: number;
};

export type CreativeDriftSignals = {
  pacingInconsistency: number;
  variantInstability: number;
  rhythmDisconnection: number;
  ctaDensityRisk: number;
  continuityCoherenceRisk: number;
  exportMismatchRisk: number;
  tonalInstability: number;
};

export type RecoveryIntelligenceState = {
  interruptionWarmth: number;
  branchRestorationCues: number;
  dormantExportGravity: number;
  blockedRenderMemory: number;
  continuityCooling: number;
};

export type OperationalTensionState = {
  blockerClusterDensity: number;
  renderFailureFriction: number;
  deadlineMomentumIntensity: number;
  topologyRestraint: number;
  atmosphereInstability: number;
};

export type MomentumFieldState = {
  exportPropagation: number;
  renderChainUrgency: number;
  recoveryCalmTransfer: number;
  continuityOpenness: number;
  productionEnergyWave: number;
};

export type EnvironmentalMemoryDepthState = {
  interruptionResidue: number;
  blockerRecurrenceMemory: number;
  stabilityCalmBias: number;
  exportSuccessConfidenceBias: number;
  continuityWarmthHalfLife: number;
};

export type CinematicPrioritizationState = {
  anchorStrength: number;
  edgeDriftPressure: number;
  continuityFocusRetention: number;
  noiseCompression: number;
  exportInevitability: number;
  blockedRenderTension: number;
};

export type SelfSteeringTopologyState = {
  inactiveCompression: number;
  activeBreathingRoom: number;
  recoveryMotionCalm: number;
  orchestrationTopologyEmphasis: number;
  exportStabilization: number;
};

export const WORKSPACE_MEMORY_KEY = "shopreel-workspace-memory-v2";

export function readWorkspaceMemory(): WorkspaceMemory | null {
  const raw = window.localStorage.getItem(WORKSPACE_MEMORY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WorkspaceMemory;
  } catch {
    return null;
  }
}

export function writeWorkspaceMemory(memory: WorkspaceMemory): void {
  window.localStorage.setItem(WORKSPACE_MEMORY_KEY, JSON.stringify(memory));
}

export function defaultCreativeContinuityMemory(): CreativeContinuityMemory {
  return {
    pacingPreference: "high_energy",
    tonePreference: "founder_story",
    hookStyle: "pattern_break",
    ctaStyle: "direct",
    visualEnergy: "kinetic",
    editingRhythm: "rapid",
    captionDensity: "light",
    platformBias: "tiktok",
    variantPreference: "parallel_variants",
    structurePattern: "hook-proof-cta",
  };
}

export function buildPendingTasks(intent: AiIntent): WorkspaceTask[] {
  const map: Record<AiIntent, WorkspaceTask[]> = {
    campaign: [
      { id: "concept", label: "Create concept", route: "/shopreel/campaigns", done: true },
      { id: "storyboard", label: "Build storyboard", route: "/shopreel/editor", done: false },
      { id: "review", label: "Review assets", route: "/shopreel/generations", done: false },
      { id: "render", label: "Render outputs", route: "/shopreel/render-queue", done: false },
      { id: "package", label: "Package for publish", route: "/shopreel/exports", done: false },
    ],
    render: [
      { id: "review-renders", label: "Review render exceptions", route: "/shopreel/render-queue", done: false },
      { id: "package-renders", label: "Package ready outputs", route: "/shopreel/exports", done: false },
    ],
    publish: [
      { id: "final-check", label: "Verify export package", route: "/shopreel/exports", done: false },
      { id: "publish", label: "Publish ready assets", route: "/shopreel/publish-queue", done: false },
    ],
    latest: [{ id: "resume", label: "Continue last generation", route: "/shopreel/generations", done: false }],
    create: [{ id: "draft", label: "Seed next draft", route: "/shopreel/create", done: false }],
    library: [{ id: "curate", label: "Curate campaign-ready assets", route: "/shopreel/library", done: false }],
    ideas: [{ id: "angles", label: "Develop campaign angles", route: "/shopreel/ideas", done: false }],
    editor: [{ id: "revise", label: "Complete draft revision", route: "/shopreel/editor", done: false }],
    unknown: [],
  };
  return map[intent];
}

export function buildContinuityThreads(input: {
  intent: AiIntent;
  pendingTasks: WorkspaceTask[];
  interruptedWorkflow?: AiIntent;
  lastRoute: string;
  generationId?: string;
  campaignId?: string;
}): ContinuityThread[] {
  const now = new Date().toISOString();
  const workflowRoute = input.generationId ? `/shopreel/generations/${input.generationId}` : input.lastRoute;
  const campaignRoute = input.campaignId ? `/shopreel/campaigns/${input.campaignId}` : "/shopreel/campaigns";
  return [
    { id: "active-workflow", kind: "active_workflow", label: `Continue ${input.intent} workflow`, route: workflowRoute, status: "active", priority: 90, updatedAt: now },
    { id: "render-cont", kind: "render_continuation", label: "Render continuation rail", route: "/shopreel/render-queue", status: input.intent === "render" ? "active" : "resolved", priority: input.intent === "render" ? 94 : 52, updatedAt: now },
    { id: "export-lineage", kind: "export_lineage", label: "Export lineage thread", route: "/shopreel/exports", status: input.pendingTasks.some((x) => /package|export|publish/i.test(x.label)) ? "active" : "resolved", priority: 81, updatedAt: now },
    { id: "campaign-evo", kind: "campaign_evolution", label: "Campaign evolution thread", route: campaignRoute, status: input.intent === "campaign" ? "active" : "resolved", priority: 73, updatedAt: now },
    { id: "scene-path", kind: "scene_path", label: "Unresolved scene path", route: workflowRoute, status: input.pendingTasks.some((x) => /storyboard|review/i.test(x.label)) ? "active" : "resolved", priority: 76, updatedAt: now },
    { id: "recovery", kind: "recovery", label: "Interrupted recovery", route: input.lastRoute, status: input.interruptedWorkflow ? "interrupted" : "resolved", priority: input.interruptedWorkflow ? 92 : 44, updatedAt: now },
  ];
}

export function evolveCreativeIntentSignals(memory: CreativeContinuityMemory): CreativeIntentSignals {
  const hookDensityBias: CreativeIntentSignals["hookDensityBias"] =
    memory.pacingPreference === "high_energy" || memory.editingRhythm === "rapid" ? "high" : memory.editingRhythm === "longform" ? "low" : "moderate";
  const exportStyleBias: CreativeIntentSignals["exportStyleBias"] =
    memory.platformBias === "tiktok" ? "speed" : memory.tonePreference === "commercial_clean" ? "craft" : "balanced";
  return {
    pacingBias: memory.pacingPreference === "cinematic" ? "cinematic" : memory.pacingPreference === "steady" ? "balanced" : "accelerated",
    ctaBias: memory.ctaStyle === "community" ? "community-led" : memory.ctaStyle === "soft" ? "story-led" : "direct",
    hookDensityBias,
    exportStyleBias,
    variantDirectionBias: memory.variantPreference === "parallel_variants" ? "parallel" : memory.variantPreference === "iterative_branching" ? "iterative" : "single",
    explainability: [
      `Pacing inferred from ${memory.pacingPreference} + ${memory.editingRhythm}.`,
      `CTA bias inferred from ${memory.ctaStyle}.`,
      `Export bias inferred from ${memory.platformBias} + ${memory.tonePreference}.`,
    ],
  };
}

function clampScore(input: number): number {
  return Math.max(0, Math.min(100, Math.round(input)));
}

export function deriveEcosystemState(input: {
  pendingTaskCount: number;
  readyTaskCount: number;
  blockerCount: number;
  continuityThreadCount: number;
  interruptedWorkflow?: AiIntent;
  adaptiveMode?: WorkspaceMemory["adaptiveMode"];
  minutesSinceUpdate: number;
}): EcosystemState {
  const operationalSaturation = clampScore((input.pendingTaskCount * 15) + (input.blockerCount * 20));
  const interruptionPressure = clampScore((input.interruptedWorkflow ? 58 : 18) + (input.blockerCount * 16));
  const continuityImportance = clampScore(45 + (input.continuityThreadCount * 8) + (input.interruptedWorkflow ? 22 : 0));
  const activeProductionLoad = clampScore((input.pendingTaskCount * 10) + (input.readyTaskCount * 8));
  const exportReadinessPressure = clampScore((input.readyTaskCount * 24) + (input.adaptiveMode === "publish" || input.adaptiveMode === "packaging" ? 18 : 0));
  const renderUrgency = clampScore((input.adaptiveMode === "render" ? 45 : 20) + (input.blockerCount * 12));
  const unresolvedBlockerWeight = clampScore(input.blockerCount * 30);
  const focusEntropy = clampScore((input.pendingTaskCount * 9) + (input.blockerCount * 14) - (input.readyTaskCount * 8));
  const telemetryDensityPressure = clampScore((input.pendingTaskCount * 11) + (input.minutesSinceUpdate > 180 ? 24 : 8) - (input.readyTaskCount * 5));
  const temporalRailState: TemporalRailState =
    input.interruptedWorkflow ? "interrupted" :
    input.blockerCount > 1 ? "escalating" :
    input.minutesSinceUpdate <= 10 ? "active_now" :
    input.minutesSinceUpdate <= 120 ? "recent" :
    input.minutesSinceUpdate <= 720 ? "stale" : "archived";
  const environmentalEnergy: EcosystemState["environmentalEnergy"] =
    input.blockerCount > 0 ? "blocker_friction" :
    input.adaptiveMode === "render" ? "render_tension" :
    input.adaptiveMode === "publish" || input.adaptiveMode === "packaging" ? "export_momentum" :
    input.adaptiveMode === "campaign" ? "campaign_intensity" :
    input.pendingTaskCount > 2 ? "active_production" : "calm_idle";
  return {
    operationalSaturation,
    interruptionPressure,
    continuityImportance,
    activeProductionLoad,
    exportReadinessPressure,
    renderUrgency,
    unresolvedBlockerWeight,
    focusEntropy,
    telemetryDensityPressure,
    temporalRailState,
    environmentalEnergy,
    explainability: [
      `Saturation derives from ${input.pendingTaskCount} pending tasks and ${input.blockerCount} blockers.`,
      `Temporal rail is ${temporalRailState.replaceAll("_", " ")} from ${input.minutesSinceUpdate} minute recency.`,
      `Energy is ${environmentalEnergy.replaceAll("_", " ")} due to adaptive mode ${input.adaptiveMode ?? "balanced"}.`,
    ],
  };
}


export function deriveCinematicOrchestrationState(input: {
  ecosystem: EcosystemState;
  minutesSinceUpdate: number;
  continuityThreadCount: number;
  blockerCount: number;
  exportReadyCount: number;
  interrupted: boolean;
}): CinematicOrchestrationState {
  const emotionalState: ProductionEmotionalState = input.blockerCount > 0
    ? "blocker_friction"
    : input.interrupted
      ? "recovery_stabilization"
      : input.ecosystem.environmentalEnergy === "render_tension"
        ? "render_momentum"
        : input.ecosystem.environmentalEnergy === "export_momentum"
          ? "export_anticipation"
          : input.ecosystem.environmentalEnergy === "campaign_intensity"
            ? "active_production_energy"
            : input.minutesSinceUpdate > 240
              ? "calm_continuity"
              : "orchestration_tension";

  const atmosphericDensity = clampScore((input.ecosystem.operationalSaturation * 0.35) + (input.blockerCount * 22) + (input.ecosystem.focusEntropy * 0.2));
  const restorationMomentum = clampScore((input.continuityThreadCount * 14) + (input.interrupted ? 24 : 4) - (input.minutesSinceUpdate > 180 ? 12 : 0));
  const continuityWarmth = clampScore((input.continuityThreadCount * 16) + (input.exportReadyCount * 12) - (input.blockerCount * 10));

  const motionPacing: CinematicOrchestrationState["motionPacing"] = atmosphericDensity >= 82
    ? "surge"
    : atmosphericDensity >= 60
      ? "momentum"
      : input.minutesSinceUpdate > 180
        ? "slow_breathing"
        : "steady";

  const luminanceBias: CinematicOrchestrationState["luminanceBias"] = emotionalState === "blocker_friction"
    ? "high_contrast"
    : emotionalState === "export_anticipation"
      ? "warm"
      : emotionalState === "calm_continuity"
        ? "cool"
        : "neutral";

  const depthFocus: CinematicOrchestrationState["depthFocus"] = input.blockerCount > 0 || input.exportReadyCount > 0
    ? "foreground"
    : input.minutesSinceUpdate > 180
      ? "background"
      : "balanced";

  const compressionLevel: CinematicOrchestrationState["compressionLevel"] = input.ecosystem.telemetryDensityPressure >= 75
    ? "compressed"
    : input.ecosystem.telemetryDensityPressure >= 55
      ? "focused"
      : input.ecosystem.telemetryDensityPressure <= 28
        ? "open"
        : "balanced";

  return {
    emotionalState,
    atmosphericDensity,
    motionPacing,
    luminanceBias,
    depthFocus,
    compressionLevel,
    restorationMomentum,
    continuityWarmth,
    explainability: [
      `Emotion is ${emotionalState.replaceAll("_", " ")} from blockers=${input.blockerCount}, interrupted=${input.interrupted}.`,
      `Motion pacing is ${motionPacing.replaceAll("_", " ")} from atmospheric density ${atmosphericDensity}.`,
      `Compression level ${compressionLevel.replaceAll("_", " ")} from telemetry pressure ${input.ecosystem.telemetryDensityPressure}.`,
    ],
  };
}


export function deriveProductionConsciousnessState(input: {
  ecosystem: EcosystemState;
  cinematic: CinematicOrchestrationState;
  continuityThreadCount: number;
  pendingTaskCount: number;
  readyTaskCount: number;
  blockerCount: number;
  minutesSinceUpdate: number;
  interrupted: boolean;
  intentSignals?: CreativeIntentSignals;
}): ProductionConsciousnessState {
  const staleFactor = clampScore((input.minutesSinceUpdate / 360) * 100);
  const activeFactor = clampScore((input.pendingTaskCount * 16) + (input.readyTaskCount * 12) - (input.blockerCount * 8));
  const awarenessBase = clampScore((input.ecosystem.activeProductionLoad * 0.55) + (input.continuityThreadCount * 10));

  const attentionEconomy: AttentionEconomyState = {
    continuityRailResistance: clampScore((input.continuityThreadCount * 18) + (input.interrupted ? 18 : 0)),
    staleTelemetryDecay: staleFactor,
    blockerPressure: clampScore(input.blockerCount * 32),
    renderLuminancePreservation: clampScore((input.ecosystem.renderUrgency * 0.68) + (input.readyTaskCount * 12)),
    exportFocusShare: clampScore((input.ecosystem.exportReadinessPressure * 0.7) + (input.readyTaskCount * 14)),
    recedingNoisePressure: clampScore((input.ecosystem.telemetryDensityPressure * 0.75) - (input.continuityThreadCount * 4)),
  };

  const creativeDrift: CreativeDriftSignals = {
    pacingInconsistency: clampScore((input.intentSignals?.pacingBias === "accelerated" ? 62 : input.intentSignals?.pacingBias === "cinematic" ? 28 : 44) + (input.blockerCount * 8) - (input.readyTaskCount * 5)),
    variantInstability: clampScore((input.intentSignals?.variantDirectionBias === "parallel" ? 58 : input.intentSignals?.variantDirectionBias === "iterative" ? 46 : 30) + (input.pendingTaskCount * 6)),
    rhythmDisconnection: clampScore((staleFactor * 0.5) + (input.blockerCount * 14)),
    ctaDensityRisk: clampScore((input.intentSignals?.ctaBias === "direct" ? 62 : 38) + (input.pendingTaskCount * 4) - (input.readyTaskCount * 4)),
    continuityCoherenceRisk: clampScore(65 - (input.continuityThreadCount * 9) + (input.interrupted ? 16 : 0)),
    exportMismatchRisk: clampScore((input.ecosystem.exportReadinessPressure * 0.52) - (input.readyTaskCount * 10) + (input.blockerCount * 10)),
    tonalInstability: clampScore((input.intentSignals?.exportStyleBias === "speed" ? 56 : 36) + (input.blockerCount * 7) + (staleFactor * 0.25)),
  };

  const recoveryIntelligence: RecoveryIntelligenceState = {
    interruptionWarmth: clampScore((input.interrupted ? 78 : 26) + (input.continuityThreadCount * 6)),
    branchRestorationCues: clampScore((input.continuityThreadCount * 15) + (input.blockerCount * 8)),
    dormantExportGravity: clampScore((input.ecosystem.exportReadinessPressure * 0.62) + (staleFactor * 0.24)),
    blockedRenderMemory: clampScore((input.blockerCount * 28) + (input.ecosystem.renderUrgency * 0.35)),
    continuityCooling: clampScore(staleFactor - (input.continuityThreadCount * 5)),
  };

  const operationalTension: OperationalTensionState = {
    blockerClusterDensity: clampScore((input.blockerCount * 34) + (input.pendingTaskCount * 8)),
    renderFailureFriction: clampScore((input.ecosystem.renderUrgency * 0.72) + (input.blockerCount * 14)),
    deadlineMomentumIntensity: clampScore((input.ecosystem.exportReadinessPressure * 0.78) + (input.readyTaskCount * 10)),
    topologyRestraint: clampScore((input.ecosystem.focusEntropy * 0.66) + (input.blockerCount * 12)),
    atmosphereInstability: clampScore((input.cinematic.atmosphericDensity * 0.7) + (input.blockerCount * 12) - (input.readyTaskCount * 6)),
  };

  const momentumField: MomentumFieldState = {
    exportPropagation: clampScore((input.readyTaskCount * 22) + (input.ecosystem.exportReadinessPressure * 0.5)),
    renderChainUrgency: clampScore((input.ecosystem.renderUrgency * 0.74) + (input.pendingTaskCount * 8)),
    recoveryCalmTransfer: clampScore((input.cinematic.restorationMomentum * 0.7) - (input.blockerCount * 6)),
    continuityOpenness: clampScore((input.cinematic.continuityWarmth * 0.75) - (input.blockerCount * 8)),
    productionEnergyWave: clampScore((activeFactor * 0.65) + (input.cinematic.atmosphericDensity * 0.22)),
  };

  const memoryDepth: EnvironmentalMemoryDepthState = {
    interruptionResidue: clampScore((input.interrupted ? 76 : 22) + (input.blockerCount * 10)),
    blockerRecurrenceMemory: clampScore((input.blockerCount * 30) + (staleFactor * 0.28)),
    stabilityCalmBias: clampScore((input.readyTaskCount * 18) + (input.continuityThreadCount * 10) - (input.blockerCount * 9)),
    exportSuccessConfidenceBias: clampScore((input.readyTaskCount * 24) + (input.ecosystem.exportReadinessPressure * 0.42)),
    continuityWarmthHalfLife: clampScore((input.cinematic.continuityWarmth * 0.72) - (staleFactor * 0.24)),
  };

  const cinematicPrioritization: CinematicPrioritizationState = {
    anchorStrength: clampScore((input.ecosystem.exportReadinessPressure * 0.45) + (input.cinematic.restorationMomentum * 0.4)),
    edgeDriftPressure: clampScore((input.ecosystem.focusEntropy * 0.8) + (input.blockerCount * 10)),
    continuityFocusRetention: clampScore((input.continuityThreadCount * 18) + (input.interrupted ? 20 : 0)),
    noiseCompression: clampScore((input.ecosystem.telemetryDensityPressure * 0.85) - (input.readyTaskCount * 6)),
    exportInevitability: clampScore((input.readyTaskCount * 26) + (input.ecosystem.exportReadinessPressure * 0.48)),
    blockedRenderTension: clampScore((input.blockerCount * 32) + (input.ecosystem.renderUrgency * 0.38)),
  };

  const selfSteeringTopology: SelfSteeringTopologyState = {
    inactiveCompression: clampScore((input.ecosystem.telemetryDensityPressure * 0.8) + (staleFactor * 0.25)),
    activeBreathingRoom: clampScore((activeFactor * 0.72) - (input.ecosystem.focusEntropy * 0.4)),
    recoveryMotionCalm: clampScore((recoveryIntelligence.interruptionWarmth * 0.6) + (input.cinematic.restorationMomentum * 0.35)),
    orchestrationTopologyEmphasis: clampScore((input.cinematic.atmosphericDensity * 0.62) + (input.continuityThreadCount * 9)),
    exportStabilization: clampScore((input.ecosystem.exportReadinessPressure * 0.75) + (input.readyTaskCount * 10)),
  };

  return {
    operationalAwareness: awarenessBase,
    continuityAwareness: clampScore((input.continuityThreadCount * 20) + (input.cinematic.continuityWarmth * 0.34)),
    momentumAwareness: clampScore((momentumField.productionEnergyWave * 0.7) + (momentumField.exportPropagation * 0.2)),
    frictionAwareness: clampScore((operationalTension.blockerClusterDensity * 0.6) + (operationalTension.renderFailureFriction * 0.25)),
    creativeCoherenceAwareness: clampScore(100 - ((creativeDrift.continuityCoherenceRisk * 0.45) + (creativeDrift.rhythmDisconnection * 0.3))),
    stagingConfidence: clampScore((input.readyTaskCount * 20) + (input.cinematic.continuityWarmth * 0.35) - (input.blockerCount * 10)),
    recoveryProbability: clampScore((recoveryIntelligence.branchRestorationCues * 0.55) + (input.cinematic.restorationMomentum * 0.35) - (staleFactor * 0.2)),
    interruptionSensitivity: clampScore((input.interrupted ? 68 : 22) + (input.blockerCount * 14)),
    productionSaturation: input.ecosystem.operationalSaturation,
    exportGravity: clampScore((attentionEconomy.exportFocusShare * 0.6) + (cinematicPrioritization.exportInevitability * 0.35)),
    renderVolatility: clampScore((input.ecosystem.renderUrgency * 0.68) + (operationalTension.renderFailureFriction * 0.24)),
    attentionEconomy,
    creativeDrift,
    recoveryIntelligence,
    operationalTension,
    momentumField,
    memoryDepth,
    cinematicPrioritization,
    selfSteeringTopology,
    explainability: [
      `Operational awareness derives from production load ${input.ecosystem.activeProductionLoad} and ${input.continuityThreadCount} continuity threads.`,
      `Attention economy prioritizes blocker pressure ${attentionEconomy.blockerPressure} versus stale telemetry decay ${attentionEconomy.staleTelemetryDecay}.`,
      `Creative coherence awareness is deterministic inverse drift from continuity risk ${creativeDrift.continuityCoherenceRisk} and rhythm drift ${creativeDrift.rhythmDisconnection}.`,
    ],
  };
}

export function derivePersistentWorldState(input: {
  ecosystem: EcosystemState;
  cinematic: CinematicOrchestrationState;
  continuityThreadCount: number;
  blockerCount: number;
  readyTaskCount: number;
  minutesSinceUpdate: number;
  interrupted: boolean;
}): PersistentWorldState {
  const operationalAging = clampScore((input.minutesSinceUpdate / 18) + (input.blockerCount * 8));
  const continuityDecay = clampScore((input.minutesSinceUpdate / 20) + (input.interrupted ? 26 : 0) - (input.continuityThreadCount * 6));
  const momentumAcceleration = clampScore((input.readyTaskCount * 24) + (input.cinematic.restorationMomentum * 0.3) - (input.blockerCount * 10));
  const renderCooling = clampScore(72 - (input.blockerCount * 18) - (input.ecosystem.renderUrgency * 0.2));
  const exportUrgencyGrowth = clampScore((input.ecosystem.exportReadinessPressure * 0.72) + (input.readyTaskCount * 12));
  const recoveryHalfLife = clampScore((input.cinematic.continuityWarmth * 0.65) + (input.continuityThreadCount * 8) - (input.minutesSinceUpdate / 28));
  const dormantRestorationWarmth = clampScore((input.continuityThreadCount * 12) + (input.interrupted ? 22 : 10));
  const escalationWindow = clampScore((input.blockerCount * 26) + (input.ecosystem.interruptionPressure * 0.45));

  return {
    operationalAging,
    continuityDecay,
    momentumAcceleration,
    renderCooling,
    exportUrgencyGrowth,
    recoveryHalfLife,
    dormantRestorationWarmth,
    escalationWindow,
    autonomousStabilizationActions: [
      input.ecosystem.telemetryDensityPressure > 58 ? "compress_stale_telemetry" : "retain_expanded_telemetry",
      input.blockerCount > 0 ? "elevate_unstable_branches" : "cool_dormant_zones",
      input.interrupted ? "restore_interrupted_workflow" : "preserve_continuity_anchors",
      input.readyTaskCount > 0 ? "expand_export_pressure_region" : "maintain_publication_staging_region",
    ],
    topologyDepth: {
      nearFieldFocus: clampScore((input.blockerCount * 22) + (input.ecosystem.renderUrgency * 0.38)),
      midFieldContinuity: clampScore((input.continuityThreadCount * 18) + (input.cinematic.continuityWarmth * 0.3)),
      farFieldTopology: clampScore((input.ecosystem.operationalSaturation * 0.62) + (operationalAging * 0.22)),
      deepLineageBackground: clampScore((dormantRestorationWarmth * 0.55) + (recoveryHalfLife * 0.3)),
    },
    cinematography: {
      pacing: clampScore(input.cinematic.atmosphericDensity * 0.72),
      urgency: clampScore((input.blockerCount * 28) + (input.ecosystem.renderUrgency * 0.4)),
      calm: clampScore((renderCooling * 0.5) + (input.cinematic.continuityWarmth * 0.3)),
      friction: clampScore((input.blockerCount * 30) + (input.ecosystem.focusEntropy * 0.42)),
      readiness: clampScore((input.readyTaskCount * 22) + (input.ecosystem.exportReadinessPressure * 0.45)),
      saturation: input.ecosystem.operationalSaturation,
      compression: clampScore(input.ecosystem.telemetryDensityPressure * 0.8),
    },
    memoryEvolution: {
      continuityScars: clampScore((input.interrupted ? 54 : 18) + (input.blockerCount * 12)),
      operationalResidue: clampScore((operationalAging * 0.58) + (input.ecosystem.focusEntropy * 0.3)),
      recurringInstability: clampScore((input.blockerCount * 25) + (continuityDecay * 0.35)),
      recoverySuccessMemory: clampScore((recoveryHalfLife * 0.55) + (input.readyTaskCount * 16)),
      bottleneckMemory: clampScore((input.blockerCount * 30) + (input.ecosystem.renderUrgency * 0.3)),
    },
  };
}
