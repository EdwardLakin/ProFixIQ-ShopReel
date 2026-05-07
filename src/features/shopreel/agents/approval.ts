import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import type { ShopReelAgentTask, ShopReelAgentTaskApprovalEvent, ShopReelAgentTaskStatus } from "./types";
type DbClient = { from: (table: string) => any };

const TRANSITION_TARGETS = {
  approved: "approved",
  rejected: "rejected",
  canceled: "canceled",
} as const satisfies Record<string, ShopReelAgentTaskStatus>;

type TransitionAction = keyof typeof TRANSITION_TARGETS;

type TransitionInput = {
  shopId: string;
  taskId: string;
  userId: string | null;
  reason?: string | null;
  metadata?: Json;
  action: TransitionAction;
};

function db() {
  return createAdminClient() as unknown as DbClient;
}

async function transitionAgentTask(input: TransitionInput): Promise<{ task: ShopReelAgentTask; event: ShopReelAgentTaskApprovalEvent }> {
  const targetStatus = TRANSITION_TARGETS[input.action];
  const { data: taskData, error: taskError } = await db()
    .from("shopreel_agent_tasks")
    .update({ status: targetStatus, updated_by: input.userId })
    .eq("id", input.taskId)
    .eq("shop_id", input.shopId)
    .eq("status", "proposed")
    .select("*")
    .maybeSingle();

  if (taskError) {
    throw new Error(taskError.message);
  }

  if (!taskData) {
    throw new Error("INVALID_TASK_STATE");
  }

  const task = taskData as ShopReelAgentTask;
  const { data: eventData, error: eventError } = await db()
    .from("shopreel_agent_task_approval_events")
    .insert({
      shop_id: input.shopId,
      task_id: task.id,
      run_id: task.run_id,
      campaign_id: task.campaign_id,
      action: input.action,
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
      created_by: input.userId,
    })
    .select("*")
    .single();

  if (eventError) {
    throw new Error(eventError.message);
  }

  return { task, event: eventData as ShopReelAgentTaskApprovalEvent };
}

export async function approveAgentTask(input: Omit<TransitionInput, "action">) {
  return transitionAgentTask({ ...input, action: "approved" });
}

export async function rejectAgentTask(input: Omit<TransitionInput, "action">) {
  return transitionAgentTask({ ...input, action: "rejected" });
}

export async function cancelAgentTask(input: Omit<TransitionInput, "action">) {
  return transitionAgentTask({ ...input, action: "canceled" });
}

export async function listApprovalEvents(input: { shopId: string; taskId: string }): Promise<ShopReelAgentTaskApprovalEvent[]> {
  const { data, error } = await db()
    .from("shopreel_agent_task_approval_events")
    .select("*")
    .eq("shop_id", input.shopId)
    .eq("task_id", input.taskId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShopReelAgentTaskApprovalEvent[];
}
