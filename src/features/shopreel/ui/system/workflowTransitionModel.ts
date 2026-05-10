import type { AiIntent } from "@/features/shopreel/ui/system/AiCommandPrimitives";

export type WorkflowType = "campaign" | "create" | "publish" | "generation" | "guided_ai" | "continuity" | "unknown";
export type WorkflowStage = "entry" | "planning" | "building" | "review" | "render" | "publish" | "resume" | "completed";
export type CompletionState = "in_progress" | "ready_for_next" | "completed" | "interrupted";

export type TransitionReason =
  | "guided_ai_command"
  | "continuity_resume"
  | "workflow_progression"
  | "manual_recovery"
  | "publish_handoff"
  | "render_escalation";

export type CanonicalWorkflowState = {
  workflow_type: WorkflowType;
  current_stage: WorkflowStage;
  next_stage: WorkflowStage;
  resumable_entity_id?: string;
  transition_reason: TransitionReason;
  completion_state: CompletionState;
};

export function resolveWorkflowType(intent: AiIntent): WorkflowType {
  if (intent === "campaign") return "campaign";
  if (intent === "create" || intent === "ideas" || intent === "editor") return "create";
  if (intent === "publish") return "publish";
  if (intent === "render" || intent === "latest") return "generation";
  if (intent === "unknown") return "unknown";
  return "guided_ai";
}

export function deriveStageFromRoute(route: string): WorkflowStage {
  if (route.includes("/campaign")) return "planning";
  if (route.includes("/create") || route.includes("/ideas") || route.includes("/editor")) return "building";
  if (route.includes("/review")) return "review";
  if (route.includes("/render")) return "render";
  if (route.includes("/publish") || route.includes("/export")) return "publish";
  if (route.includes("/generation")) return "resume";
  return "entry";
}
