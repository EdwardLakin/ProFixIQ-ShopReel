import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import type { ContinuousEcosystemEvolutionState } from "@/features/shopreel/ui/system/continuousEcosystemEvolution";
import type { GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";
import type { OperatorBehaviorMemory } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";

export type ProductionLikelyNextMove =
  | "package_or_publish"
  | "inspect_render_queue"
  | "continue_campaign"
  | "restore_continuity"
  | "resume_previous_work"
  | "prepare_export"
  | "resolve_render_blocker"
  | "continue_active_workflow";

export type ProductionIntuitionSnapshot = {
  likelyNextMove: ProductionLikelyNextMove;
  confidence: number;
  confidenceReason: string;
  suggestedSurface: string;
  suggestedCommand: string;
  urgency: "low" | "moderate" | "high";
  continuityNeed: number;
  renderWatchNeed: number;
  exportMomentumNeed: number;
  recoveryNeed: number;
  dormantSimplificationNeed: number;
  explanation: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function deriveProductionIntuition(args: {
  operator: OperatorBehaviorMemory;
  continuity: GlobalEnvironmentContinuitySnapshot;
  evolution: ContinuousEcosystemEvolutionState | null;
  memory: WorkspaceMemory | null;
  routePathname: string;
}): ProductionIntuitionSnapshot {
  const recent = args.operator.recentEvents;
  const byType = (type: string) => recent.filter((event) => event.type === type).length;

  const exportOpen = byType("export_opened");
  const renderChecks = byType("render_checked");
  const campaignOpen = byType("campaign_opened");
  const recoveryOpen = byType("recovery_opened") + byType("continuity_restored");
  const continuation = byType("workflow_continued");
  const routeTransitions = byType("route_changed");
  const now = Date.now();
  const dormantHours = (now - new Date(args.operator.lastActiveAt).getTime()) / 3600000;

  const continuityNeed = clamp(args.continuity.continuityFracture * 0.65 + (args.evolution?.continuityFractureSpread ?? 0) * 0.35);
  const renderWatchNeed = clamp(args.continuity.renderInstability * 0.7 + renderChecks * 4 + (args.evolution?.renderInstabilityInfluence ?? 0) * 0.2);
  const exportMomentumNeed = clamp(args.continuity.exportMomentum * 0.75 + exportOpen * 5 + (args.evolution?.exportMomentumPersistence ?? 0) * 0.25);
  const recoveryNeed = clamp(continuityNeed * 0.5 + recoveryOpen * 7 + (args.continuity.recoveryCorridor === "forming" ? 15 : args.continuity.recoveryCorridor === "stable" ? 24 : 0));
  const dormantSimplificationNeed = clamp(args.continuity.dormantInfluence * 0.6 + (args.evolution?.dormantNavigationCooling ?? 0) * 0.4 + (dormantHours >= 18 ? 18 : 0));

  const unresolved = args.memory?.pendingTasks.filter((task) => !task.done).length ?? 0;
  const hasRenderBlockers = (args.memory?.pendingTasks ?? []).some((task) => !task.done && /render|verify/i.test(task.label));

  let likelyNextMove: ProductionLikelyNextMove = "continue_active_workflow";
  if (hasRenderBlockers && renderWatchNeed >= 70) likelyNextMove = "resolve_render_blocker";
  else if (exportOpen >= 2 && exportMomentumNeed >= 62) likelyNextMove = "package_or_publish";
  else if (renderChecks >= 2 && renderWatchNeed >= 58) likelyNextMove = "inspect_render_queue";
  else if (campaignOpen >= 2) likelyNextMove = "continue_campaign";
  else if (continuityNeed >= 68 && recoveryOpen >= 1) likelyNextMove = "restore_continuity";
  else if (dormantHours >= 18) likelyNextMove = "resume_previous_work";
  else if (exportMomentumNeed >= 68) likelyNextMove = "prepare_export";

  const map = {
    package_or_publish: { surface: "/shopreel/publish", command: "open publish queue", reason: "Repeated export/publish behavior and sustained export momentum." },
    inspect_render_queue: { surface: "/shopreel/render", command: "show render queue blockers", reason: "Frequent render checks indicate monitoring intent." },
    continue_campaign: { surface: "/shopreel/campaigns", command: "continue active campaign", reason: "Campaign surfaces were repeatedly opened." },
    restore_continuity: { surface: "/shopreel/review", command: "restore continuity and recover interrupted flow", reason: "Continuity fracture plus recovery history suggests restoration." },
    resume_previous_work: { surface: args.memory?.lastRoute ?? "/shopreel", command: "resume previous work", reason: "Dormant return pattern suggests quick resume flow." },
    prepare_export: { surface: "/shopreel/publish", command: "prepare export package", reason: "High export momentum without explicit publish completion." },
    resolve_render_blocker: { surface: "/shopreel/render", command: "resolve top render blocker", reason: "Render instability and unresolved render tasks are elevated." },
    continue_active_workflow: { surface: args.memory?.lastRoute ?? args.routePathname, command: "continue current workflow", reason: "No dominant deterministic branch exceeded threshold." },
  } as const;

  const selected = map[likelyNextMove];
  const confidence = clamp(Math.max(40, (likelyNextMove === "continue_active_workflow" ? 42 : 58) + Math.min(18, routeTransitions) + Math.floor(unresolved / 2)));
  const urgency: ProductionIntuitionSnapshot["urgency"] = renderWatchNeed >= 75 || continuityNeed >= 72 ? "high" : exportMomentumNeed >= 58 || recoveryNeed >= 58 ? "moderate" : "low";

  return {
    likelyNextMove,
    confidence,
    confidenceReason: selected.reason,
    suggestedSurface: selected.surface,
    suggestedCommand: selected.command,
    urgency,
    continuityNeed,
    renderWatchNeed,
    exportMomentumNeed,
    recoveryNeed,
    dormantSimplificationNeed,
    explanation: [
      `Behavior signals: export ${exportOpen}, render checks ${renderChecks}, campaign opens ${campaignOpen}, continuation ${continuation}.`,
      `Environment continuity: fracture ${args.continuity.continuityFracture}, render instability ${args.continuity.renderInstability}, export momentum ${args.continuity.exportMomentum}.`,
      `Route transitions ${routeTransitions}, unresolved tasks ${unresolved}, dormant gap ${dormantHours.toFixed(1)}h.`,
    ],
  };
}
