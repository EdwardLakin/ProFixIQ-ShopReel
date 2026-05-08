import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET() {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const db = createAdminClient() as any;
    const { data: executions } = await db.from("shopreel_agent_executions").select("id,status,execution_type,task_id,campaign_id,updated_at").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(50);
    const { data: tasks } = await db.from("shopreel_agent_tasks").select("id,title").eq("shop_id", shopId);
    const { data: campaigns } = await db.from("shopreel_campaigns").select("id,title").eq("shop_id", shopId);
    const { data: recentEvents } = await db.from("shopreel_execution_events").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(50);

    const taskMap = new Map((tasks ?? []).map((t: any) => [t.id, t.title]));
    const campaignMap = new Map((campaigns ?? []).map((c: any) => [c.id, c.title]));
    const latestEventByExecution = new Map<string, any>();
    for (const ev of recentEvents ?? []) if (!latestEventByExecution.has(ev.execution_id)) latestEventByExecution.set(ev.execution_id, ev);

    const normalized = (executions ?? []).map((e: any) => ({ ...e, task_title: taskMap.get(e.task_id) ?? "Untitled task", campaign_name: e.campaign_id ? (campaignMap.get(e.campaign_id) ?? "Unknown campaign") : "No campaign", latest_event: latestEventByExecution.get(e.id) ?? null }));
    const executionCounts = normalized.reduce((acc: Record<string, number>, e: any) => ({ ...acc, [e.status]: (acc[e.status] ?? 0) + 1 }), { pending: 0, prepared: 0, blocked: 0, failed: 0, canceled: 0 });
    const blockedExecutions = normalized.filter((e: any) => e.status === "blocked" || e.status === "failed");

    return NextResponse.json({ ok: true, executionCounts, recentExecutions: normalized, blockedExecutions, recentEvents: recentEvents ?? [] });
  } catch (error) { return toEndpointErrorResponse(error, "Failed to load operations summary"); }
}
