import type { AdaptiveProductionAtmosphereState } from "@/features/shopreel/ui/system/adaptiveProductionAtmosphere";
import type { ContinuousEcosystemEvolutionState } from "@/features/shopreel/ui/system/continuousEcosystemEvolution";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";
import type { OperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import type { StrategicAdaptationSnapshot } from "@/features/shopreel/ui/system/strategicAdaptation";
import type { ProductionExecutionSnapshot } from "@/features/shopreel/ui/system/productionExecutionIntelligence";
import type { WorkflowEmbodimentSnapshot } from "@/features/shopreel/ui/system/workflowEmbodiment";
import type { EnvironmentalEmbodimentSnapshot } from "@/features/shopreel/ui/system/environmentalEmbodiment";

export type SpatialTerrainMode = "active_path" | "continuity_hold" | "render_tight" | "export_forward" | "recovery_room" | "stable_wait";

export type SpatialWorkspaceBehaviorSnapshot = {
  activeTerrainMode: SpatialTerrainMode;
  primaryWorkspaceWeight: number;
  continuityWorkspaceWeight: number;
  exportWorkspaceWeight: number;
  renderWorkspaceWeight: number;
  dormantWorkspaceWeight: number;
  instabilityCompression: number;
  recoveryExpansion: number;
  routeCarryoverStrength: number;
  forwardProgressionPull: number;
  workspaceDensity: "tight" | "balanced" | "open";
  spatialPriority: "render_attention" | "ready_to_publish" | "needs_review" | "continue_work" | "waiting";
  lanePosture: "expanded" | "balanced" | "compact";
  explanation: string[];
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function deriveSpatialWorkspaceBehaviorSnapshot(args: {
  continuity: GlobalEnvironmentContinuitySnapshot;
  evolution: ContinuousEcosystemEvolutionState | null;
  atmosphere: AdaptiveProductionAtmosphereState | null;
  rhythm: OperatorRhythmSnapshot;
  strategic: StrategicAdaptationSnapshot;
  execution: ProductionExecutionSnapshot;
  workflow: WorkflowEmbodimentSnapshot;
  embodiment: EnvironmentalEmbodimentSnapshot;
  routeContext: string;
}): SpatialWorkspaceBehaviorSnapshot {
  const instabilityCompression = clamp(args.workflow.renderPressure * 0.58 + args.continuity.renderInstability * 0.42);
  const recoveryExpansion = clamp((args.atmosphere?.recoveryCalm ?? 44) * 0.4 + (args.embodiment.recoveryBreathingRoom === "wide" ? 36 : args.embodiment.recoveryBreathingRoom === "open" ? 16 : 0) + (args.continuity.recoveryCorridor === "stable" ? 24 : 0));
  const routeCarryoverStrength = clamp((args.continuity.routeTransitionMemory.transitionCount > 0 ? 22 : 0) + args.execution.routeContinuityPriority * 0.5 + (args.workflow.routeTransitionCarryover.toLowerCase().includes("carryover") ? 18 : 0));
  const forwardProgressionPull = clamp(args.execution.exportReadinessBias * 0.52 + args.workflow.exportPull * 0.3 + (args.embodiment.exportForwardPull === "leading" ? 18 : 0));
  const dormantWorkspaceWeight = clamp(args.continuity.dormantInfluence * 0.65 + (args.embodiment.dormantRecession === "recessed" ? 20 : 0));

  const continuityWorkspaceWeight = clamp(args.workflow.continuityWeight * 0.62 + routeCarryoverStrength * 0.38);
  const renderWorkspaceWeight = clamp(args.execution.renderUrgencyBias * 0.72 + instabilityCompression * 0.28);
  const exportWorkspaceWeight = clamp(args.execution.exportReadinessBias * 0.66 + forwardProgressionPull * 0.34);
  const primaryWorkspaceWeight = clamp(100 - dormantWorkspaceWeight * 0.35 + Math.max(renderWorkspaceWeight, exportWorkspaceWeight, continuityWorkspaceWeight) * 0.18);

  const activeTerrainMode: SpatialTerrainMode =
    instabilityCompression >= 72 ? "render_tight" :
    forwardProgressionPull >= 70 ? "export_forward" :
    recoveryExpansion >= 72 ? "recovery_room" :
    continuityWorkspaceWeight >= 66 ? "continuity_hold" :
    primaryWorkspaceWeight >= 60 ? "active_path" : "stable_wait";

  const workspaceDensity: SpatialWorkspaceBehaviorSnapshot["workspaceDensity"] =
    instabilityCompression >= 70 || args.rhythm.navigationDensity === "dense" ? "tight" :
    recoveryExpansion >= 70 || args.atmosphere?.density === "open" ? "open" : "balanced";

  const lanePosture: SpatialWorkspaceBehaviorSnapshot["lanePosture"] =
    activeTerrainMode === "render_tight" ? "compact" :
    activeTerrainMode === "recovery_room" || activeTerrainMode === "continuity_hold" ? "expanded" : "balanced";

  const route = args.routeContext.toLowerCase();
  const spatialPriority: SpatialWorkspaceBehaviorSnapshot["spatialPriority"] =
    renderWorkspaceWeight >= 68 || route.includes("render") ? "render_attention" :
    exportWorkspaceWeight >= 66 || route.includes("export") ? "ready_to_publish" :
    args.execution.reviewContinuityBias >= 64 || route.includes("review") ? "needs_review" :
    continuityWorkspaceWeight >= 58 ? "continue_work" : "waiting";

  return {
    activeTerrainMode,
    primaryWorkspaceWeight,
    continuityWorkspaceWeight,
    exportWorkspaceWeight,
    renderWorkspaceWeight,
    dormantWorkspaceWeight,
    instabilityCompression,
    recoveryExpansion,
    routeCarryoverStrength,
    forwardProgressionPull,
    workspaceDensity,
    spatialPriority,
    lanePosture,
    explanation: [
      `Terrain ${activeTerrainMode.replaceAll("_", " ")} from render ${renderWorkspaceWeight}, continuity ${continuityWorkspaceWeight}, export ${exportWorkspaceWeight}.`,
      `Carryover ${routeCarryoverStrength} keeps route lineage visible across transitions.`,
      `Posture ${lanePosture} with ${workspaceDensity} density; dormant weight ${dormantWorkspaceWeight}.`,
    ],
  };
}
