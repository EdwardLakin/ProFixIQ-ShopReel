import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

export type RuntimeChoreographyAction = "morph" | "compress" | "expand" | "stack" | "resolve" | "interrupt" | "restore";
export type RuntimeContinuityRelation = "same_surface" | "adjacent_flow" | "handoff" | "interruption" | "recovery" | "cold_start";

export type RuntimeChoreographySnapshot = {
  action: RuntimeChoreographyAction;
  relation: RuntimeContinuityRelation;
  intensity: number;
  reducedMotionClass: string;
  motionClass: string;
  message: string;
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
    staleState,
  };
}
