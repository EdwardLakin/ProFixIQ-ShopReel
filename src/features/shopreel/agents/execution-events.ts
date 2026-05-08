import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import type { ShopReelAgentExecution, ShopReelAgentExecutionStatus } from "./types";

type DbClient = { from: (table: string) => any };

function db(): DbClient { return createAdminClient() as unknown as DbClient; }

export const INVALID_EXECUTION_TRANSITION = "INVALID_EXECUTION_TRANSITION";

const allowedTransitions: Record<ShopReelAgentExecutionStatus, ShopReelAgentExecutionStatus[]> = {
  pending: ["prepared", "blocked", "failed", "canceled"],
  prepared: ["blocked", "failed", "canceled"],
  blocked: ["prepared", "failed", "canceled"],
  failed: ["prepared"],
  canceled: [],
};

export function validateExecutionTransition(current: ShopReelAgentExecutionStatus, next: ShopReelAgentExecutionStatus) {
  return allowedTransitions[current].includes(next);
}

export async function appendExecutionEvent(input: {
  shopId: string; execution: ShopReelAgentExecution; eventType: "created"|"prepared"|"blocked"|"failed"|"canceled"|"validated"|"note";
  previousStatus?: string | null; nextStatus?: string | null; message?: string | null; metadata?: Json; userId?: string | null;
}) {
  const { data, error } = await db().from("shopreel_execution_events").insert({
    shop_id: input.shopId, execution_id: input.execution.id, task_id: input.execution.task_id, run_id: input.execution.run_id,
    campaign_id: input.execution.campaign_id, event_type: input.eventType, previous_status: input.previousStatus ?? null,
    next_status: input.nextStatus ?? null, message: input.message ?? null, metadata: input.metadata ?? {}, created_by: input.userId ?? null,
  }).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function transitionExecutionState(input: { shopId: string; executionId: string; nextStatus: ShopReelAgentExecutionStatus; userId: string | null; message?: string | null; metadata?: Json; }) {
  const { data: current, error: currentError } = await db().from("shopreel_agent_executions").select("*").eq("shop_id", input.shopId).eq("id", input.executionId).maybeSingle();
  if (currentError) throw new Error(currentError.message);
  if (!current) throw new Error("EXECUTION_NOT_FOUND");
  const execution = current as ShopReelAgentExecution;
  if (!validateExecutionTransition(execution.status, input.nextStatus)) throw new Error(INVALID_EXECUTION_TRANSITION);

  const { data: updated, error: updateError } = await db().from("shopreel_agent_executions").update({ status: input.nextStatus, error_message: input.message ?? null, updated_by: input.userId }).eq("shop_id", input.shopId).eq("id", input.executionId).select("*").single();
  if (updateError) throw new Error(updateError.message);
  const next = updated as ShopReelAgentExecution;
  const eventType = input.nextStatus === "prepared" ? "prepared" : input.nextStatus === "blocked" ? "blocked" : input.nextStatus === "failed" ? "failed" : "canceled";
  await appendExecutionEvent({ shopId: input.shopId, execution: next, eventType, previousStatus: execution.status, nextStatus: input.nextStatus, message: input.message, metadata: input.metadata, userId: input.userId });
  return next;
}
