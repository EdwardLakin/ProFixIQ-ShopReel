import type { EcosystemMode, EcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";
import type { OperatorRhythmSnapshot } from "@/features/shopreel/ui/system/operatorRhythm";
import type { ProductionIntuitionSnapshot } from "@/features/shopreel/ui/system/productionIntuition";
import type { StrategicAdaptationSnapshot } from "@/features/shopreel/ui/system/strategicAdaptation";

export type ProductionMode = "stabilize" | "render_focus" | "export_focus" | "review_focus" | "campaign_focus" | "create_focus";
export type RecommendedSurface = "/shopreel/create" | "/shopreel/render-queue" | "/shopreel/exports" | "/shopreel/review" | "/shopreel/campaigns" | "/shopreel/editor";

export type ProductionExecutionSnapshot = {
  activeProductionMode: ProductionMode;
  recommendedSurface: RecommendedSurface;
  routeContinuityPriority: number;
  exportReadinessBias: number;
  renderUrgencyBias: number;
  reviewContinuityBias: number;
  campaignLineageBias: number;
  createFlowBias: number;
  blockedChainPressure: number;
  nextOperationalMove: string;
  explanation: string[];
};

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function mapMode(mode: EcosystemMode): ProductionMode {
  if (mode === "render") return "render_focus";
  if (mode === "publish") return "export_focus";
  if (mode === "campaign") return "campaign_focus";
  if (mode === "recovery" || mode === "continuity") return "stabilize";
  return "create_focus";
}

export function deriveProductionExecutionIntelligence(args: {
  ecosystem: EcosystemStateSnapshot;
  continuity: GlobalEnvironmentContinuitySnapshot;
  rhythm: OperatorRhythmSnapshot;
  intuition: ProductionIntuitionSnapshot;
  strategic: StrategicAdaptationSnapshot;
  routePath: string;
}): ProductionExecutionSnapshot {
  const blockedChainPressure = clamp(args.ecosystem.blockerFocus * 0.7 + args.continuity.renderInstability * 0.3);
  const routeContinuityPriority = clamp((100 - args.ecosystem.continuityHealth) * 0.55 + args.continuity.continuityFracture * 0.45);
  const exportReadinessBias = clamp(args.ecosystem.exportMomentum * 0.55 + args.intuition.exportMomentumNeed * 0.25 + args.strategic.exportBias * 0.2);
  const renderUrgencyBias = clamp(args.ecosystem.renderPressure * 0.5 + args.intuition.renderWatchNeed * 0.3 + args.strategic.renderBias * 0.2);
  const reviewContinuityBias = clamp(routeContinuityPriority * 0.5 + args.ecosystem.reviewRisk * 0.3 + args.strategic.recoveryBias * 0.2);
  const campaignLineageBias = clamp(args.strategic.orchestrationBias * 0.3 + args.strategic.focusPersistence * 0.25 + args.strategic.continuityRoutingBias * 0.2 + (args.rhythm.workingMode === "campaign_build" ? 25 : 0));
  const createFlowBias = clamp((100 - blockedChainPressure) * 0.35 + (args.ecosystem.operationalPressure < 50 ? 20 : 0) + (args.rhythm.workingMode === "exploratory" ? 16 : 0) + (args.routePath.includes("/create") ? 18 : 0));

  const scores: Array<{ surface: RecommendedSurface; score: number }> = [
    { surface: "/shopreel/render-queue", score: renderUrgencyBias + blockedChainPressure * 0.18 },
    { surface: "/shopreel/exports", score: exportReadinessBias + (args.intuition.urgency === "moderate" ? 4 : 0) },
    { surface: "/shopreel/review", score: reviewContinuityBias },
    { surface: "/shopreel/campaigns", score: campaignLineageBias },
    { surface: "/shopreel/create", score: createFlowBias },
    { surface: "/shopreel/editor", score: clamp(args.strategic.focusPersistence * 0.45 + args.ecosystem.operationalPressure * 0.2) },
  ];

  const recommendedSurface = scores.sort((a, b) => b.score - a.score)[0]?.surface ?? "/shopreel/create";
  const activeProductionMode = mapMode(args.ecosystem.ecosystemMode);
  const nextOperationalMove = args.intuition.suggestedCommand;

  return {
    activeProductionMode,
    recommendedSurface,
    routeContinuityPriority,
    exportReadinessBias,
    renderUrgencyBias,
    reviewContinuityBias,
    campaignLineageBias,
    createFlowBias,
    blockedChainPressure,
    nextOperationalMove,
    explanation: [
      `Recommended ${recommendedSurface} from render ${renderUrgencyBias}, export ${exportReadinessBias}, review ${reviewContinuityBias}.`,
      `Blocked chain pressure ${blockedChainPressure} with continuity priority ${routeContinuityPriority}.`,
      `Rhythm ${args.rhythm.cadence} (${args.rhythm.workingMode.replaceAll("_", " ")}) keeps transitions deterministic.`,
    ],
  };
}
