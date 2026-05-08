import { createAdminClient } from "@/lib/supabase/server";

type DbClient = { from: (table: string) => any };
const db = () => createAdminClient() as unknown as DbClient;

export async function validateExecutionReadiness(input: { shopId: string; executionId: string }) {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  const { data: execution } = await db().from("shopreel_agent_executions").select("*").eq("shop_id", input.shopId).eq("id", input.executionId).maybeSingle();
  if (!execution) return { ready: false, blockingIssues: ["execution_not_found"], warnings };

  const { data: task } = await db().from("shopreel_agent_tasks").select("id,status").eq("shop_id", input.shopId).eq("id", execution.task_id).maybeSingle();
  if (!task) blockingIssues.push("task_not_found");
  if (task && task.status !== "approved") blockingIssues.push("task_not_approved");

  const { data: run } = await db().from("shopreel_agent_runs").select("id").eq("shop_id", input.shopId).eq("id", execution.run_id).maybeSingle();
  if (!run) blockingIssues.push("run_not_found");

  if (execution.campaign_id) {
    const { data: campaign } = await db().from("shopreel_campaigns").select("id").eq("shop_id", input.shopId).eq("id", execution.campaign_id).maybeSingle();
    if (!campaign) blockingIssues.push("campaign_not_found");
  } else {
    warnings.push("campaign_missing");
  }

  return { ready: blockingIssues.length === 0, blockingIssues, warnings };
}
