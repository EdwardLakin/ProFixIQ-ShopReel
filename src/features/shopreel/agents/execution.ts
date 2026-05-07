import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import type { ShopReelAgentExecution, ShopReelAgentExecutionType, ShopReelAgentTask } from "./types";

type DbClient = { from: (table: string) => any };

function db(): DbClient {
  return createAdminClient() as unknown as DbClient;
}

function resolveExecutionType(taskType: ShopReelAgentTask["task_type"]): ShopReelAgentExecutionType {
  if (taskType === "create_content_idea" || taskType === "draft_script" || taskType === "draft_storyboard") return "story_generation";
  if (taskType === "suggest_render") return "render_preparation";
  if (taskType === "suggest_publish") return "publish_preparation";
  return "analytics_snapshot";
}

export async function createExecutionFromApprovedTask(input: { shopId: string; taskId: string; userId: string | null }): Promise<ShopReelAgentExecution> {
  const { data: taskData, error: taskError } = await db().from("shopreel_agent_tasks").select("*").eq("id", input.taskId).eq("shop_id", input.shopId).maybeSingle();
  if (taskError) throw new Error(taskError.message);
  if (!taskData) throw new Error("TASK_NOT_FOUND");
  const task = taskData as ShopReelAgentTask;
  if (task.status !== "approved") throw new Error("TASK_NOT_APPROVED");

  const { data: activeExecution, error: activeError } = await db()
    .from("shopreel_agent_executions")
    .select("id")
    .eq("shop_id", input.shopId)
    .eq("task_id", input.taskId)
    .in("status", ["pending", "prepared", "blocked"])
    .maybeSingle();
  if (activeError) throw new Error(activeError.message);
  if (activeExecution) throw new Error("ACTIVE_EXECUTION_EXISTS");

  const inputSnapshot: Json = {
    task: {
      id: task.id,
      taskType: task.task_type,
      title: task.title,
      status: task.status,
      campaignId: task.campaign_id,
      generationId: task.generation_id,
      renderJobId: task.render_job_id,
      publicationId: task.publication_id,
    },
    run: {
      id: task.run_id,
      agentType: task.agent_type,
    },
  };

  const { data, error } = await db()
    .from("shopreel_agent_executions")
    .insert({
      shop_id: input.shopId,
      task_id: task.id,
      run_id: task.run_id,
      campaign_id: task.campaign_id,
      execution_type: resolveExecutionType(task.task_type),
      status: "pending",
      generation_id: task.generation_id,
      render_job_id: task.render_job_id,
      publication_id: task.publication_id,
      input_snapshot: inputSnapshot,
      output: {},
      trace: {},
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ShopReelAgentExecution;
}

export async function listExecutionsForCampaign(input: { shopId: string; campaignId?: string | null }): Promise<ShopReelAgentExecution[]> {
  let query = db().from("shopreel_agent_executions").select("*").eq("shop_id", input.shopId).order("updated_at", { ascending: false }).limit(100);
  if (input.campaignId) query = query.eq("campaign_id", input.campaignId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ShopReelAgentExecution[];
}

export async function getExecution(input: { shopId: string; executionId: string }): Promise<ShopReelAgentExecution | null> {
  const { data, error } = await db().from("shopreel_agent_executions").select("*").eq("shop_id", input.shopId).eq("id", input.executionId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ShopReelAgentExecution | null) ?? null;
}

export async function cancelExecution(input: { shopId: string; executionId: string; userId: string | null }): Promise<ShopReelAgentExecution> {
  const { data, error } = await db()
    .from("shopreel_agent_executions")
    .update({ status: "canceled", updated_by: input.userId })
    .eq("shop_id", input.shopId)
    .eq("id", input.executionId)
    .in("status", ["pending", "prepared", "blocked"])
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("INVALID_EXECUTION_STATE");
  return data as ShopReelAgentExecution;
}
