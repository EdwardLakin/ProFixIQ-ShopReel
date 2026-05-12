import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import type { PersistedChamberMemory } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

export type RuntimeChoreographyAction = "morph" | "compress" | "expand" | "stack" | "resolve" | "interrupt" | "restore";
export type RuntimeContinuityRelation = "same_surface" | "adjacent_flow" | "handoff" | "interruption" | "recovery" | "cold_start";

export type RuntimeChoreographySnapshot = {
  action: RuntimeChoreographyAction;
  relation: RuntimeContinuityRelation;
  intensity: number;
  reducedMotionClass: string;
  motionClass: string;
  message: string;
  chamberIdentityLabel: string;
  memoryResidue: string[];
  densityMode: "focused" | "weighted" | "recessed";
  depthModel: {
    activeLayerClass: string;
    previousLayerClass: string;
    futureLayerClass: string;
    shellLightingClass: string;
    continuityRailClass: string;
    objectiveGlowClass: string;
    backdropClass: string;
    supportSurfaceClass: string;
    chamberAtmosphereClass: string;
    memoryResidueClass: string;
  };
  staleState: null | {
    reason: "restored_from_persistence" | "campaign_archived" | "review_resolved_elsewhere" | "entity_unavailable";
    detail: string;
    fallbackRoute: string;
    actionLabel: string;
  };
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function relationForTransition(previous: OperatorSurfaceId | null, next: OperatorSurfaceId, interrupted: boolean): RuntimeContinuityRelation {
  if (!previous) return "cold_start";
  if (interrupted) return "interruption";
  if (previous === next) return "same_surface";
  if (previous === "review_inbox" && next === "campaign_workspace") return "handoff";
  if (previous === "campaign_planning" && next === "campaign_workspace") return "adjacent_flow";
  return "adjacent_flow";
}

export function deriveRuntimeChoreography(input: {
  session: OperatorRuntimeSessionState;
  memory: WorkspaceMemory | null;
  pendingApprovals: number;
  refinementDepth: number;
  campaignUnavailable: boolean;
  reducedMotion: boolean;
  chamberMemory: PersistedChamberMemory | null;
}): RuntimeChoreographySnapshot {
  const relation = relationForTransition(input.session.previousSurface, input.session.activeSurface, Boolean(input.session.interruption));
  const interrupted = Boolean(input.session.interruption);
  const recovered = input.session.pendingTransition === "restore_previous";

  const intensity = clamp(
    (input.session.pendingTransition ? 35 : 18) +
      input.pendingApprovals * 8 +
      input.refinementDepth * 6 +
      (interrupted ? 26 : 0) +
      (recovered ? 10 : 0),
  );

  let action: RuntimeChoreographyAction = "morph";
  if (interrupted) action = "interrupt";
  else if (recovered || relation === "recovery") action = "restore";
  else if (input.session.activeSurface === "review_inbox" && input.pendingApprovals === 0) action = "resolve";
  else if (input.session.activeSurface === "publish_package_review") action = "expand";
  else if (input.session.activeSurface === "campaign_workspace" && input.session.previousSurface === "campaign_planning") action = "morph";
  else if (input.session.runtimeState === "awaiting_approval") action = "compress";
  else if (relation === "handoff") action = "stack";

  const message =
    action === "morph" ? "Carrying approved direction into refinement…" :
    action === "resolve" ? "Review resolved. Preparing next operational step." :
    action === "restore" ? "Restoring previous workflow context…" :
    action === "compress" ? "Waiting for approval before generation continues." :
    action === "interrupt" ? "Manual operations layered over active runtime context." :
    action === "expand" ? "Packaging is growing from current campaign progression." :
    "Maintaining workflow continuity across operator surfaces.";

  const chamberIdentityLabel =
    input.session.runtimeState === "planning_campaign" ? "Planning chamber" :
    input.session.runtimeState === "generating_draft" ? "Drafting chamber" :
    input.session.runtimeState === "refining_output" ? "Refinement chamber" :
    input.session.runtimeState === "awaiting_approval" ? "Approval threshold" :
    input.session.runtimeState === "assembling_package" ? "Packaging corridor" :
    input.session.runtimeState === "completed_export_ready" ? "Resolved chamber" :
    interrupted ? "Interrupted chamber" : "Active chamber";

  const memoryResidue = (input.chamberMemory?.traces ?? [])
    .slice(0, 3)
    .map((trace) => `${trace.runtimeState.replaceAll("_", " ")} · ${trace.interruptionReason ? "interrupted" : "stable"}`);

  const densityMode: "focused" | "weighted" | "recessed" =
    interrupted || input.session.runtimeState === "awaiting_approval"
      ? "weighted"
      : input.session.runtimeState === "completed_export_ready"
        ? "recessed"
        : "focused";

  const staleState = (() => {
    if (input.campaignUnavailable && input.session.selectedEntityIds.campaignId) {
      return { reason: "entity_unavailable" as const, detail: "The active campaign is no longer available in persistence.", fallbackRoute: "/shopreel/campaigns", actionLabel: "Open campaigns" };
    }
    if (input.session.activeSurface === "review_inbox" && input.pendingApprovals === 0 && input.session.runtimeState === "reviewing_decision") {
      return { reason: "review_resolved_elsewhere" as const, detail: "Review items were resolved outside this canvas.", fallbackRoute: "/shopreel/review", actionLabel: "Open review history" };
    }
    if (input.session.pendingTransition === "restore_previous") {
      return { reason: "restored_from_persistence" as const, detail: "Runtime was restored from persisted session context.", fallbackRoute: input.session.fallbackRoute, actionLabel: "Open restored workspace" };
    }
    return null;
  })();

  return {
    action,
    relation,
    intensity,
    reducedMotionClass: "motion-reduce:transition-none motion-reduce:transform-none",
    motionClass: input.reducedMotion ? "" : `transition-all duration-300 ${action === "stack" ? "md:translate-y-0" : ""}`,
    message,
    depthModel: {
      activeLayerClass: input.reducedMotion
        ? "opacity-100"
        : "scale-100 opacity-100 shadow-[0_32px_80px_rgba(8,12,28,0.65)]",
      previousLayerClass: input.reducedMotion
        ? "opacity-70"
        : "scale-[0.97] -translate-y-1 opacity-70 blur-[0.3px]",
      futureLayerClass: input.reducedMotion
        ? "opacity-80"
        : "scale-[0.985] translate-y-1 opacity-80",
      shellLightingClass:
        action === "interrupt"
          ? "from-amber-500/14 via-slate-900/75 to-[#050813]/95"
          : action === "restore"
            ? "from-cyan-400/16 via-indigo-950/70 to-[#040611]/95"
            : action === "compress"
              ? "from-violet-500/15 via-slate-900/75 to-[#050813]/95"
              : "from-blue-500/10 via-slate-950/70 to-[#03050f]/95",
      continuityRailClass: input.reducedMotion ? "opacity-90" : "opacity-95",
      objectiveGlowClass:
        action === "interrupt"
          ? "from-amber-300/25 via-amber-100/10 to-transparent"
          : action === "restore"
            ? "from-cyan-300/30 via-indigo-200/10 to-transparent"
            : action === "compress"
              ? "from-violet-300/28 via-violet-100/10 to-transparent"
              : "from-cyan-300/25 via-blue-200/10 to-transparent",
      backdropClass:
        action === "interrupt"
          ? "bg-[radial-gradient(90%_65%_at_84%_8%,rgba(251,191,36,0.14),transparent_68%),radial-gradient(82%_80%_at_0%_100%,rgba(124,58,237,0.12),transparent_66%)]"
          : action === "restore"
            ? "bg-[radial-gradient(95%_68%_at_80%_4%,rgba(34,211,238,0.14),transparent_66%),radial-gradient(88%_88%_at_5%_92%,rgba(99,102,241,0.13),transparent_70%)]"
            : action === "compress"
              ? "bg-[radial-gradient(92%_64%_at_85%_5%,rgba(196,181,253,0.14),transparent_67%),radial-gradient(78%_92%_at_8%_90%,rgba(56,189,248,0.09),transparent_68%)]"
              : "bg-[radial-gradient(95%_70%_at_84%_5%,rgba(96,165,250,0.15),transparent_68%),radial-gradient(70%_90%_at_5%_86%,rgba(167,139,250,0.12),transparent_66%)]",
      supportSurfaceClass: input.reducedMotion ? "opacity-90" : "opacity-80 saturate-[0.88]",
      chamberAtmosphereClass:
        densityMode === "weighted"
          ? "bg-[radial-gradient(80%_55%_at_52%_40%,rgba(248,250,252,0.1),transparent_72%)]"
          : densityMode === "recessed"
            ? "bg-[radial-gradient(76%_52%_at_52%_38%,rgba(125,211,252,0.06),transparent_75%)]"
            : "bg-[radial-gradient(84%_58%_at_52%_36%,rgba(103,232,249,0.1),transparent_72%)]",
      memoryResidueClass: input.reducedMotion ? "opacity-70" : "opacity-65 blur-[0.2px]",
    },
    chamberIdentityLabel,
    memoryResidue,
    densityMode,
    staleState,
  };
}
