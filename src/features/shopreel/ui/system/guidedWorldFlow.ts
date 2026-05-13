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

export type WorldGuidedPrompt = {
  question: string;
  yes: { href: string; label: string; nextStep: GuidedFlowStepId | null };
  no: { href: string; label: string; nextStep: GuidedFlowStepId | null };
};

const WORLD_PROMPTS: Record<RuntimeWorldId, WorldGuidedPrompt> = {
  campaign: { question: "Ready to turn this campaign into draft outputs?", yes: { href: "/shopreel/generations", label: "Open generation", nextStep: "asset_readiness" }, no: { href: "/shopreel/campaigns", label: "Stay in campaign", nextStep: "select_output_type" } },
  idea: { question: "Do you want to convert this idea into a campaign?", yes: { href: "/shopreel/campaigns", label: "Create campaign", nextStep: "select_output_type" }, no: { href: "/shopreel/opportunities", label: "Refine idea", nextStep: "clarify_objective" } },
  upload: { question: "Do you want to use these assets in a new draft?", yes: { href: "/shopreel/generations", label: "Start draft", nextStep: "idea_script_readiness" }, no: { href: "/shopreel/upload", label: "Continue upload", nextStep: "asset_readiness" } },
  asset_library: { question: "Use this asset set in the next generation?", yes: { href: "/shopreel/generations", label: "Open generation", nextStep: "idea_script_readiness" }, no: { href: "/shopreel/library", label: "Stay in library", nextStep: "asset_readiness" } },
  generation: { question: "Send this draft to review?", yes: { href: "/shopreel/review", label: "Open review", nextStep: "draft_acceptable" }, no: { href: "/shopreel/generations", label: "Keep drafting", nextStep: "idea_script_readiness" } },
  video_creation: { question: "Continue building this video package?", yes: { href: "/shopreel/video-creation", label: "Continue package", nextStep: "draft_acceptable" }, no: { href: "/shopreel/generations", label: "Return to draft", nextStep: "idea_script_readiness" } },
  review: { question: "Approve this and move toward publishing?", yes: { href: "/shopreel/publish-center", label: "Move to publish", nextStep: "publish_timing" }, no: { href: "/shopreel/review", label: "Inspect review", nextStep: "draft_acceptable" } },
  render: { question: "Retry or inspect this render?", yes: { href: "/shopreel/render-queue", label: "Inspect render", nextStep: "render_complete" }, no: { href: "/shopreel/operations", label: "Open recovery", nextStep: "render_complete" } },
  publish: { question: "Schedule or publish this package?", yes: { href: "/shopreel/publish-center", label: "Publish now", nextStep: "analyze_results" }, no: { href: "/shopreel/calendar", label: "Schedule", nextStep: "analyze_results" } },
  calendar: { question: "Create content for this slot?", yes: { href: "/shopreel/generations", label: "Create content", nextStep: "idea_script_readiness" }, no: { href: "/shopreel/calendar", label: "Stay in calendar", nextStep: "analyze_results" } },
  analytics: { question: "Use this signal to plan the next campaign?", yes: { href: "/shopreel/campaigns", label: "Plan campaign", nextStep: "select_output_type" }, no: { href: "/shopreel/analytics", label: "Stay in analytics", nextStep: "analyze_results" } },
  automation: { question: "Open recovery actions for this automation?", yes: { href: "/shopreel/operations", label: "Open actions", nextStep: null }, no: { href: "/shopreel/operator", label: "Operator view", nextStep: null } },
  operations: { question: "Resume the blocked workflow?", yes: { href: "/shopreel/operations", label: "Resume workflow", nextStep: null }, no: { href: "/shopreel", label: "Back to deck", nextStep: null } },
};

export function resolveWorldGuidedPrompt(worldId: RuntimeWorldId): WorldGuidedPrompt {
  return WORLD_PROMPTS[worldId];
}
