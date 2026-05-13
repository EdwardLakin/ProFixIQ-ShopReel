import { RUNTIME_WORLD_MAP, type RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type GuidedFlowStepId =
  | "clarify_objective"
  | "select_output_type"
  | "asset_readiness"
  | "idea_script_readiness"
  | "draft_acceptable"
  | "render_complete"
  | "publish_timing"
  | "analyze_results";

export type GuidedWorldTransition = {
  worldId: RuntimeWorldId;
  href: string;
  nextStep: GuidedFlowStepId | null;
  actionLabel: string;
};

export type GuidedWorldFlowStep = {
  currentStep: GuidedFlowStepId;
  question: string;
  yes: GuidedWorldTransition;
  no: GuidedWorldTransition;
  objective: string;
};

const to = (worldId: RuntimeWorldId, nextStep: GuidedFlowStepId | null, actionLabel: string): GuidedWorldTransition => ({
  worldId,
  href: RUNTIME_WORLD_MAP[worldId].canonicalRoute,
  nextStep,
  actionLabel,
});

const FLOW: Record<GuidedFlowStepId, GuidedWorldFlowStep> = {
  clarify_objective: {
    currentStep: "clarify_objective",
    question: "Is the objective clear?",
    yes: to("campaign", "select_output_type", "Continue campaign planning"),
    no: to("idea", "clarify_objective", "Clarify objective in opportunities"),
    objective: "Define what you want to create and why.",
  },
  select_output_type: {
    currentStep: "select_output_type",
    question: "Do you know the content type (ad/video/post/campaign)?",
    yes: to("generation", "asset_readiness", "Open generation workspace"),
    no: to("idea", "select_output_type", "Choose content type in idea workspace"),
    objective: "Lock the output type before production.",
  },
  asset_readiness: {
    currentStep: "asset_readiness",
    question: "Do you already have assets?",
    yes: to("generation", "idea_script_readiness", "Create from existing assets"),
    no: to("upload", "idea_script_readiness", "Upload assets first"),
    objective: "Ensure source assets are ready.",
  },
  idea_script_readiness: {
    currentStep: "idea_script_readiness",
    question: "Is the idea or script ready?",
    yes: to("video_creation", "draft_acceptable", "Open video creation"),
    no: to("idea", "idea_script_readiness", "Develop script in ideas/opportunities"),
    objective: "Prepare creative direction before drafting.",
  },
  draft_acceptable: {
    currentStep: "draft_acceptable",
    question: "Is the draft acceptable?",
    yes: to("review", "render_complete", "Open review queue"),
    no: to("review", "draft_acceptable", "Refine in review workspace"),
    objective: "Review draft quality before render.",
  },
  render_complete: {
    currentStep: "render_complete",
    question: "Is render complete?",
    yes: to("publish", "publish_timing", "Open publish center"),
    no: to("render", "render_complete", "Resolve render queue"),
    objective: "Confirm render completion before publish.",
  },
  publish_timing: {
    currentStep: "publish_timing",
    question: "Publish now? (No = schedule)",
    yes: to("publish", "analyze_results", "Publish from publish center"),
    no: to("calendar", "analyze_results", "Schedule in calendar"),
    objective: "Choose immediate publish or scheduled release.",
  },
  analyze_results: {
    currentStep: "analyze_results",
    question: "Analyze results now?",
    yes: to("analytics", null, "Open analytics"),
    no: to("operations", null, "Return to operator deck"),
    objective: "Close the loop with performance insights.",
  },
};

export function resolveGuidedFlowStep(step: GuidedFlowStepId): GuidedWorldFlowStep {
  return FLOW[step];
}
