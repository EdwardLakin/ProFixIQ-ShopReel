import type { AiIntent } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

export type WorkflowPosture = "create_posture" | "review_posture" | "render_posture" | "export_posture" | "recovery_posture" | "dormant_posture" | "escalation_posture";
export type TransitionIntent =
  | "create_to_campaign"
  | "campaign_to_editor"
  | "editor_to_review"
  | "review_to_render"
  | "render_to_export"
  | "export_to_publish"
  | "resume_interrupted_work"
  | "continue_latest"
  | "restore_continuity"
  | "return_to_active_branch";

export type TransitionMode = "progression" | "continuity" | "recovery" | "escalation";

export type TransitionSnapshot = {
  previousSurface: string;
  nextSurface: string;
  previousWorkflowStep: string;
  nextWorkflowStep: string;
  activeProductionBranch: string;
  continuityCorridor: string;
  mode: TransitionMode;
  posture: WorkflowPosture;
  routeCarryover: string;
  focusCarryover: string;
  nextActionLabel: string;
  updatedAt: string;
};

export type TransitionPath = {
  intent: TransitionIntent;
  mode: TransitionMode;
  from: string;
  to: string;
  continuityCorridor: string;
  nextActionLabel: string;
};

export type TransitionContext = {
  currentRoute: string;
  targetRoute: string;
  command: string;
  interpretedIntent: AiIntent;
  memory: WorkspaceMemory | null;
};

const PATHS: TransitionPath[] = [
  { intent: "create_to_campaign", mode: "progression", from: "/shopreel/ideas", to: "/shopreel/campaigns", continuityCorridor: "ideas_to_campaign", nextActionLabel: "Create campaign brief" },
  { intent: "campaign_to_editor", mode: "progression", from: "/shopreel/campaigns", to: "/shopreel/editor", continuityCorridor: "campaign_to_editor", nextActionLabel: "Continue campaign draft" },
  { intent: "editor_to_review", mode: "continuity", from: "/shopreel/editor", to: "/shopreel/review", continuityCorridor: "editor_to_review", nextActionLabel: "Review output" },
  { intent: "review_to_render", mode: "escalation", from: "/shopreel/review", to: "/shopreel/render-queue", continuityCorridor: "review_to_render", nextActionLabel: "Render next" },
  { intent: "render_to_export", mode: "progression", from: "/shopreel/render-queue", to: "/shopreel/exports", continuityCorridor: "render_to_export", nextActionLabel: "Package assets" },
  { intent: "export_to_publish", mode: "progression", from: "/shopreel/exports", to: "/shopreel/publish-queue", continuityCorridor: "export_to_publish", nextActionLabel: "Publish ready outputs" },
];

function derivePosture(route: string, mode: TransitionMode): WorkflowPosture {
  if (mode === "recovery") return "recovery_posture";
  if (mode === "escalation") return "escalation_posture";
  if (route.includes("create") || route.includes("ideas") || route.includes("campaign")) return "create_posture";
  if (route.includes("review")) return "review_posture";
  if (route.includes("render")) return "render_posture";
  if (route.includes("export") || route.includes("publish")) return "export_posture";
  return "dormant_posture";
}

export function resolveTransitionIntent(context: TransitionContext): TransitionIntent {
  const manual = context.command.toLowerCase();
  if (/(resume interrupted|restore continuity|return to active branch)/.test(manual)) return "restore_continuity";
  if (/(continue latest|continue|resume)/.test(manual)) return "continue_latest";
  if (context.memory?.interruptedWorkflow) return "resume_interrupted_work";
  return "return_to_active_branch";
}

export function deriveTransitionSnapshot(context: TransitionContext): TransitionSnapshot {
  const explicit = PATHS.find((path) => context.currentRoute.startsWith(path.from) && context.targetRoute.startsWith(path.to));
  const intent = explicit?.intent ?? resolveTransitionIntent(context);
  const mode: TransitionMode =
    intent === "resume_interrupted_work" || intent === "restore_continuity" ? "recovery" :
    intent === "review_to_render" ? "escalation" :
    intent === "continue_latest" || intent === "return_to_active_branch" ? "continuity" : "progression";

  const corridor = explicit?.continuityCorridor ?? `${context.currentRoute.replace("/shopreel/", "") || "home"}_to_${context.targetRoute.replace("/shopreel/", "") || "home"}`;
  const branch = context.memory?.lastWorkflow ?? context.interpretedIntent;
  const previousStep = context.memory?.lastRoute ?? context.currentRoute;

  return {
    previousSurface: context.currentRoute,
    nextSurface: context.targetRoute,
    previousWorkflowStep: previousStep,
    nextWorkflowStep: context.targetRoute,
    activeProductionBranch: branch,
    continuityCorridor: corridor,
    mode,
    posture: derivePosture(context.targetRoute, mode),
    routeCarryover: `Carry ${context.currentRoute} context into ${context.targetRoute}.`,
    focusCarryover: context.memory?.lastCommand || "Continue active production focus",
    nextActionLabel: explicit?.nextActionLabel ?? "Continue draft",
    updatedAt: new Date().toISOString(),
  };
}
