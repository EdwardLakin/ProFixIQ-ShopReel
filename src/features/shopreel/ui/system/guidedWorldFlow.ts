import type { RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type GuidedFlowStepId =
  | "clarify_objective"
  | "select_output_type"
  | "asset_readiness"
  | "idea_script_readiness"
  | "output_acceptable"
  | "render_complete"
  | "publish_timing"
  | "analyze_or_defer";

export type GuidedWorldFlowStep = {
  currentStep: GuidedFlowStepId;
  question: string;
  yesTargetWorld: RuntimeWorldId;
  noTargetWorld: RuntimeWorldId;
  recommendedAction: string;
  requiredWorld: RuntimeWorldId;
  isTerminal: boolean;
};

const FLOW: Record<GuidedFlowStepId, GuidedWorldFlowStep> = {
  clarify_objective: { currentStep: "clarify_objective", question: "What are we making right now?", yesTargetWorld: "idea", noTargetWorld: "idea", recommendedAction: "Define objective and audience.", requiredWorld: "idea", isTerminal: false },
  select_output_type: { currentStep: "select_output_type", question: "Do you know the output type (ad/video/post/campaign)?", yesTargetWorld: "campaign", noTargetWorld: "idea", recommendedAction: "Select output format.", requiredWorld: "campaign", isTerminal: false },
  asset_readiness: { currentStep: "asset_readiness", question: "Are assets ready?", yesTargetWorld: "generation", noTargetWorld: "upload", recommendedAction: "Upload or confirm source assets.", requiredWorld: "upload", isTerminal: false },
  idea_script_readiness: { currentStep: "idea_script_readiness", question: "Is idea/script ready?", yesTargetWorld: "generation", noTargetWorld: "idea", recommendedAction: "Prepare script or concept.", requiredWorld: "idea", isTerminal: false },
  output_acceptable: { currentStep: "output_acceptable", question: "Is output acceptable?", yesTargetWorld: "render", noTargetWorld: "review", recommendedAction: "Approve or request refinements.", requiredWorld: "review", isTerminal: false },
  render_complete: { currentStep: "render_complete", question: "Is render complete?", yesTargetWorld: "publish", noTargetWorld: "render", recommendedAction: "Resolve render queue blockers.", requiredWorld: "render", isTerminal: false },
  publish_timing: { currentStep: "publish_timing", question: "Publish now or schedule?", yesTargetWorld: "publish", noTargetWorld: "calendar", recommendedAction: "Choose immediate publish or scheduled release.", requiredWorld: "publish", isTerminal: false },
  analyze_or_defer: { currentStep: "analyze_or_defer", question: "Analyze results now?", yesTargetWorld: "analytics", noTargetWorld: "operations", recommendedAction: "Review performance or defer follow-up.", requiredWorld: "analytics", isTerminal: true },
};

export function resolveGuidedFlowStep(step: GuidedFlowStepId): GuidedWorldFlowStep { return FLOW[step]; }
