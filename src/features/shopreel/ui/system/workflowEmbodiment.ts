import type { EcosystemSurface, EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";
import type { OperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import type { ProductionIntuitionSnapshot } from "@/features/shopreel/ui/system/productionIntuition";
import type { StrategicAdaptationSnapshot } from "@/features/shopreel/ui/system/strategicAdaptation";
import type { ProductionExecutionSnapshot } from "@/features/shopreel/ui/system/productionExecutionIntelligence";

export type WorkflowMode = "continuation" | "blocker_resolution" | "packaging" | "lineage" | "branch_stabilization" | "review_recovery";

export type WorkflowEmbodimentSnapshot = {
  primaryWorkMode: WorkflowMode;
  embodiedSurface: string;
  continuityWeight: number;
  exportPull: number;
  renderPressure: number;
  reviewUrgency: number;
  creationBias: number;
  campaignLineageBias: number;
  routeTransitionCarryover: string;
  recommendedCompression: "open" | "compact" | "tight";
  nextWorkflowPosture: string;
  explanation: string[];
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

const SURFACE_POSTURE: Record<EcosystemSurface, string> = {
  home: "Stabilize production branch",
  create: "Continue interrupted creation",
  render: "Resolve render blocker",
  publish: "Package ready assets",
  campaigns: "Return to campaign lineage",
  review: "Review continuity gap",
  editor: "Stabilize production branch",
  library: "Continue interrupted export",
};

export function deriveWorkflowEmbodimentSnapshot(args: {
  surface: EcosystemSurface;
  ecosystem: EcosystemStateSnapshot;
  continuity: GlobalEnvironmentContinuitySnapshot;
  rhythm: OperatorRhythmSnapshot;
  intuition: ProductionIntuitionSnapshot;
  strategic: StrategicAdaptationSnapshot;
  execution: ProductionExecutionSnapshot;
}): WorkflowEmbodimentSnapshot {
  const continuityWeight = clamp(args.execution.routeContinuityPriority * 0.55 + args.continuity.continuityFracture * 0.45);
  const exportPull = clamp(args.execution.exportReadinessBias * 0.6 + args.intuition.exportMomentumNeed * 0.25 + args.continuity.exportMomentum * 0.15);
  const renderPressure = clamp(args.execution.renderUrgencyBias * 0.65 + args.ecosystem.renderPressure * 0.35);
  const reviewUrgency = clamp(args.execution.reviewContinuityBias * 0.7 + (100 - args.ecosystem.continuityHealth) * 0.3);
  const creationBias = clamp(args.execution.createFlowBias * 0.75 + (args.rhythm.workingMode === "exploratory" ? 16 : 0));
  const campaignLineageBias = clamp(args.execution.campaignLineageBias * 0.7 + args.strategic.continuityRoutingBias * 0.3);

  const mode: WorkflowMode = renderPressure >= 68
    ? "blocker_resolution"
    : exportPull >= 68
      ? "packaging"
      : reviewUrgency >= 66
        ? "review_recovery"
        : campaignLineageBias >= 64
          ? "lineage"
          : continuityWeight >= 60
            ? "continuation"
            : "branch_stabilization";

  const recommendedCompression: WorkflowEmbodimentSnapshot["recommendedCompression"] =
    args.rhythm.cadence === "urgent" || mode === "blocker_resolution" ? "tight" :
    args.rhythm.cadence === "compressed" || mode === "packaging" || mode === "review_recovery" ? "compact" : "open";

  const previous = args.continuity.routeTransitionMemory.previousRoute.replace("/shopreel/", "").replace("/shopreel", "home");
  const current = args.continuity.routeTransitionMemory.currentRoute.replace("/shopreel/", "").replace("/shopreel", "home");
  const routeTransitionCarryover = previous === current
    ? `Holding ${current} context with continuity weight ${continuityWeight}.`
    : `Carryover from ${previous} → ${current}: ${SURFACE_POSTURE[args.surface]}.`;

  const nextWorkflowPosture =
    args.surface === "create" && continuityWeight >= 58 ? "Continue interrupted creation" :
    args.surface === "render" ? "Resolve render blocker" :
    args.surface === "publish" && exportPull >= 56 ? "Package ready assets" :
    args.surface === "review" ? "Review continuity gap" :
    args.surface === "campaigns" ? "Return to campaign lineage" :
    args.surface === "editor" ? "Stabilize production branch" :
    SURFACE_POSTURE[args.surface];

  return {
    primaryWorkMode: mode,
    embodiedSurface: args.execution.recommendedSurface,
    continuityWeight,
    exportPull,
    renderPressure,
    reviewUrgency,
    creationBias,
    campaignLineageBias,
    routeTransitionCarryover,
    recommendedCompression,
    nextWorkflowPosture,
    explanation: [
      `Mode ${mode.replaceAll("_", " ")} from continuity ${continuityWeight}, render ${renderPressure}, export ${exportPull}.`,
      routeTransitionCarryover,
      `Compression ${recommendedCompression} from cadence ${args.rhythm.cadence} and surface ${args.surface}.`,
    ],
  };
}
