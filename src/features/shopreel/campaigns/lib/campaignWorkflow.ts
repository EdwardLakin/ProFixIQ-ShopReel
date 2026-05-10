import type { CanonicalWorkflowState } from "@/features/shopreel/ui/system/workflowTransitionModel";

export type CampaignWorkflowStage = "idea" | "selection" | "editing" | "generation" | "review" | "publish_prep";

export type CampaignWorkflowDescriptor = {
  flow: "campaign_guided";
  stage: CampaignWorkflowStage;
  nextStage: CampaignWorkflowStage | null;
  campaignId?: string;
  generationId?: string;
  resumeRoute: string;
  updatedAt: string;
};

const STAGES: CampaignWorkflowStage[] = ["idea", "selection", "editing", "generation", "review", "publish_prep"];

export function deriveCampaignWorkflowStage(route: string): CampaignWorkflowStage {
  if (route.startsWith("/shopreel/ideas")) return "idea";
  if (route.startsWith("/shopreel/campaigns") && !route.includes("/campaigns/")) return "selection";
  if (route.startsWith("/shopreel/campaigns/") || route.startsWith("/shopreel/editor")) return "editing";
  if (route.startsWith("/shopreel/generations")) return "generation";
  if (route.startsWith("/shopreel/review")) return "review";
  return "publish_prep";
}

export function nextCampaignWorkflowStage(stage: CampaignWorkflowStage): CampaignWorkflowStage | null {
  const idx = STAGES.indexOf(stage);
  if (idx < 0 || idx === STAGES.length - 1) return null;
  return STAGES[idx + 1] ?? null;
}

export function toCanonicalWorkflowStage(stage: CampaignWorkflowStage): CanonicalWorkflowState["current_stage"] {
  if (stage === "idea") return "entry";
  if (stage === "selection") return "planning";
  if (stage === "editing") return "building";
  if (stage === "generation") return "render";
  if (stage === "review") return "review";
  return "publish";
}

export function buildCampaignWorkflowDescriptor(input: {
  route: string;
  campaignId?: string;
  generationId?: string;
  resumeRoute?: string;
  previous?: CampaignWorkflowDescriptor | null;
}): CampaignWorkflowDescriptor {
  const stage = deriveCampaignWorkflowStage(input.route);
  const previous = input.previous;
  return {
    flow: "campaign_guided",
    stage,
    nextStage: nextCampaignWorkflowStage(stage),
    campaignId: input.campaignId ?? previous?.campaignId,
    generationId: input.generationId ?? previous?.generationId,
    resumeRoute: input.resumeRoute ?? input.route,
    updatedAt: new Date().toISOString(),
  };
}

export function campaignWorkflowProgress(stage: CampaignWorkflowStage): number {
  return STAGES.indexOf(stage) + 1;
}
