export type OperatorFlowStage =
  | "idea"
  | "campaign_plan"
  | "script"
  | "scenes"
  | "creative_output"
  | "review"
  | "approval"
  | "schedule"
  | "publish"
  | "results"
  | "memory_learning";

export type OperatorFlowIntent =
  | "start_idea"
  | "create_campaign"
  | "generate_script"
  | "generate_scenes"
  | "review_output"
  | "approve_stage"
  | "revise_stage"
  | "schedule_publish"
  | "view_results"
  | "resume_flow"
  | "unknown";

export type OperatorFlowEntity = { kind?: string | null; status?: string | null; href?: string | null; title?: string | null; id?: string | null };
export type OperatorFlowAction = "continue" | "review" | "approve" | "revise" | "generate_next" | "schedule" | "publish" | "view_results" | "back_to_deck";
export type OperatorFlowState = { stage: OperatorFlowStage; route: string; intent: OperatorFlowIntent; entity: OperatorFlowEntity | null; reason: string; recommendedNextAction: OperatorFlowAction; nextRouteAfterApproval: string; revisionRoute: string };

const STAGE_ROUTE_MAP: Record<OperatorFlowStage, string> = {
  idea: "/shopreel/ideas",
  campaign_plan: "/shopreel/campaigns/new",

  // Campaign work should stay inside the campaign workspace/item production flow.
  // The generic editor/storyboards/generations pages are fallback/manual surfaces,
  // not the correct next step after approving a campaign brief.
  script: "/shopreel/campaigns",
  scenes: "/shopreel/campaigns",
  creative_output: "/shopreel/campaigns",

  review: "/shopreel/review",
  approval: "/shopreel/review",
  schedule: "/shopreel/calendar",
  publish: "/shopreel/publish-center",
  results: "/shopreel/analytics",
  memory_learning: "/shopreel/operator",
};
const NEXT_STAGE: Record<OperatorFlowStage, OperatorFlowStage> = {
  idea: "campaign_plan",

  // Campaign approval should move into scene/reference-frame production,
  // not the generic editor.
  campaign_plan: "scenes",

  script: "scenes",
  scenes: "creative_output",
  creative_output: "review",
  review: "approval",
  approval: "schedule",
  schedule: "publish",
  publish: "results",
  results: "memory_learning",
  memory_learning: "idea",
};

export const routeForStage = (stage: OperatorFlowStage): string => STAGE_ROUTE_MAP[stage];
export function resolveInitialStageFromCommand(command: string): { stage: OperatorFlowStage; intent: OperatorFlowIntent; reason: string } {
  const c = command.toLowerCase();
  if (/(idea|brainstorm|concept)/.test(c)) return { stage: "idea", intent: "start_idea", reason: "Idea prompt detected." };
  if (/(campaign|launch)/.test(c)) return { stage: "campaign_plan", intent: "create_campaign", reason: "Campaign creation intent detected." };
  if (/(script|hook|caption)/.test(c)) return { stage: "script", intent: "generate_script", reason: "Script generation intent detected." };
  if (/(scene|storyboard|shot)/.test(c)) return { stage: "scenes", intent: "generate_scenes", reason: "Scene generation intent detected." };
  if (/(review|approval|approve)/.test(c)) return { stage: "review", intent: "review_output", reason: "Review intent detected." };
  if (/(schedule|calendar)/.test(c)) return { stage: "schedule", intent: "schedule_publish", reason: "Scheduling intent detected." };
  if (/(publish|post)/.test(c)) return { stage: "publish", intent: "schedule_publish", reason: "Publish intent detected." };
  if (/(analytics|report|performance|results)/.test(c)) return { stage: "results", intent: "view_results", reason: "Reporting intent detected." };
  if (/(resume|continue|recent|latest)/.test(c)) return { stage: "review", intent: "resume_flow", reason: "Resume intent detected." };
  return { stage: "campaign_plan", intent: "unknown", reason: "Defaulting to campaign planning stage." };
}
export function resolveStageFromEntity(entity: OperatorFlowEntity | null | undefined): OperatorFlowStage {
  const hay = `${entity?.href ?? ""} ${entity?.status ?? ""} ${entity?.kind ?? ""}`.toLowerCase();
  if (/analytics/.test(hay)) return "results";
  if (/publish|posted/.test(hay)) return "publish";
  if (/calendar|schedul/.test(hay)) return "schedule";
  if (/review|approval/.test(hay)) return "review";
  if (/generation|creative|render/.test(hay)) return "creative_output";
  if (/scene|storyboard/.test(hay)) return "scenes";
  if (/editor|script/.test(hay)) return "script";
  if (/idea/.test(hay)) return "idea";
  return "campaign_plan";
}
export const resolveNextStageAfterApproval = (currentStage: OperatorFlowStage): OperatorFlowStage => NEXT_STAGE[currentStage];
export const resolveRevisionStage = (currentStage: OperatorFlowStage): OperatorFlowStage => (currentStage === "approval" ? "review" : currentStage);
export function resolveResumeStage(recentEntities: OperatorFlowEntity[] = []): OperatorFlowStage { const unresolved = recentEntities.find((x) => /(review|approval|pending|draft|blocked)/i.test(x.status ?? "")); return unresolved ? resolveStageFromEntity(unresolved) : (recentEntities[0] ? resolveStageFromEntity(recentEntities[0]) : "campaign_plan"); }
export function buildOperatorFlowState(input: { command: string; entity?: OperatorFlowEntity | null; recentEntities?: OperatorFlowEntity[] }): OperatorFlowState {
  const initial = resolveInitialStageFromCommand(input.command);
  const stage = initial.intent === "resume_flow" ? resolveResumeStage(input.recentEntities ?? []) : (input.entity ? resolveStageFromEntity(input.entity) : initial.stage);
  return { stage, route: routeForStage(stage), intent: initial.intent, entity: input.entity ?? null, reason: initial.reason, recommendedNextAction: stage === "review" || stage === "approval" ? "approve" : stage === "results" ? "view_results" : "continue", nextRouteAfterApproval: routeForStage(resolveNextStageAfterApproval(stage)), revisionRoute: routeForStage(resolveRevisionStage(stage)) };
}
