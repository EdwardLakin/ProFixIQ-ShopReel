import { createAgentRun, createAgentTasks } from "./repository";
import { buildAgentPlanningContext } from "./context";
import type { AgentPlanSummary, ShopReelAgentType } from "./types";

export async function createPlanningDraft(input: { shopId: string; campaignId: string; userId: string | null; agentType: ShopReelAgentType; }) : Promise<AgentPlanSummary> {
  const context = await buildAgentPlanningContext({ shopId: input.shopId, campaignId: input.campaignId });
  const run = await createAgentRun({ shopId: input.shopId, campaignId: input.campaignId, userId: input.userId, agentType: input.agentType, inputSnapshot: context, output: { mode: "planning_only" }, trace: { source: "shopreel_phase2_planner" }, confidence: 0.72 });
  const tasks = await createAgentTasks({ runId: run.id, shopId: input.shopId, campaignId: input.campaignId, userId: input.userId, agentType: input.agentType, tasks: [
    { taskType: "create_content_idea", priority: "high", title: "Propose campaign content idea", details: "Align with campaign objective and channel priorities", inputSnapshot: context, confidence: 0.75 },
    { taskType: "draft_script", priority: "medium", title: "Draft script direction", details: "Provide story hook and structure with guardrails", inputSnapshot: context, confidence: 0.71 },
    { taskType: "suggest_publish", priority: "low", title: "Suggest posting window", details: "Recommend timing without enqueuing publication", inputSnapshot: context, confidence: 0.69 },
  ]});
  const averageConfidence = tasks.length ? tasks.reduce((sum, t) => sum + (t.confidence ?? 0), 0) / tasks.length : null;
  return { run, tasks, summary: { proposedCount: tasks.length, requiresApprovalCount: tasks.filter((t) => t.requires_approval).length, averageConfidence } };
}
