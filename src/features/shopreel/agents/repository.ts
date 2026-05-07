import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import type { ShopReelAgentRun, ShopReelAgentTask, ShopReelAgentTaskPriority, ShopReelAgentTaskType, ShopReelAgentType } from "./types";

type DbClient = { from: (table: string) => any };
function db(): DbClient { return createAdminClient() as unknown as DbClient; }

export async function createAgentRun(input: { shopId: string; campaignId?: string | null; userId: string | null; agentType: ShopReelAgentType; inputSnapshot: Json; output?: Json; trace?: Json; confidence?: number | null; }): Promise<ShopReelAgentRun> {
  const { data, error } = await db().from("shopreel_agent_runs").insert({ shop_id: input.shopId, campaign_id: input.campaignId ?? null, agent_type: input.agentType, status: "planned", input_snapshot: input.inputSnapshot, output: input.output ?? {}, trace: input.trace ?? {}, confidence: input.confidence ?? null, requires_approval: true, created_by: input.userId, updated_by: input.userId }).select("*").single();
  if (error) throw new Error(error.message);
  return data as ShopReelAgentRun;
}

export async function createAgentTasks(input: { runId: string; shopId: string; campaignId?: string | null; userId: string | null; agentType: ShopReelAgentType; tasks: Array<{ taskType: ShopReelAgentTaskType; priority: ShopReelAgentTaskPriority; title: string; details?: string | null; inputSnapshot?: Json; confidence?: number | null; }>; }): Promise<ShopReelAgentTask[]> {
  const payload = input.tasks.map((task) => ({ run_id: input.runId, shop_id: input.shopId, campaign_id: input.campaignId ?? null, agent_type: input.agentType, task_type: task.taskType, status: "proposed", priority: task.priority, title: task.title, details: task.details ?? null, input_snapshot: task.inputSnapshot ?? {}, output: {}, trace: {}, confidence: task.confidence ?? null, requires_approval: true, created_by: input.userId, updated_by: input.userId }));
  const { data, error } = await db().from("shopreel_agent_tasks").insert(payload).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as ShopReelAgentTask[];
}

export async function listAgentRuns(shopId: string, campaignId?: string | null): Promise<ShopReelAgentRun[]> { let query = db().from("shopreel_agent_runs").select("*").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(20); if (campaignId) query = query.eq("campaign_id", campaignId); const { data, error } = await query; if (error) throw new Error(error.message); return (data ?? []) as ShopReelAgentRun[]; }
export async function getAgentRunWithTasks(shopId: string, runId: string): Promise<{ run: ShopReelAgentRun | null; tasks: ShopReelAgentTask[]; }> { const { data: runData, error: runError } = await db().from("shopreel_agent_runs").select("*").eq("shop_id", shopId).eq("id", runId).maybeSingle(); if (runError) throw new Error(runError.message); if (!runData) return { run: null, tasks: [] }; const { data: taskData, error: taskError } = await db().from("shopreel_agent_tasks").select("*").eq("shop_id", shopId).eq("run_id", runId).order("created_at", { ascending: true }); if (taskError) throw new Error(taskError.message); return { run: runData as ShopReelAgentRun, tasks: (taskData ?? []) as ShopReelAgentTask[] }; }
