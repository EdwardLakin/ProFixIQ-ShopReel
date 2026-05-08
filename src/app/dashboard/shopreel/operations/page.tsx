import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext } from "@/features/shopreel/server/endpointPolicy";
import { ShopReelActionRail, ShopReelPageHero } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default async function OperationsPage() {
  const { shopId } = await requireUserActionTenantContext();
  const db = createAdminClient() as any;
  const { data: executions } = await db.from("shopreel_agent_executions").select("id,status,execution_type,task_id,campaign_id,updated_at").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(30);
  const { data: tasks } = await db.from("shopreel_agent_tasks").select("id,title,status").eq("shop_id", shopId);
  const { data: campaigns } = await db.from("shopreel_campaigns").select("id,title").eq("shop_id", shopId);
  const { data: events } = await db.from("shopreel_execution_events").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(30);
  const taskMap = new Map((tasks ?? []).map((t: any) => [t.id, t]));
  const campaignMap = new Map((campaigns ?? []).map((c: any) => [c.id, c.title]));
  const eventMap = new Map<string, any>(); for (const e of events ?? []) if (!eventMap.has(e.execution_id)) eventMap.set(e.execution_id, e);
  const rows = (executions ?? []).map((e: any) => ({ ...e, task: taskMap.get(e.task_id), campaignName: e.campaign_id ? campaignMap.get(e.campaign_id) : "No campaign", latestEvent: eventMap.get(e.id) }));
  const counts = rows.reduce((a: any, e: any) => ({ ...a, [e.status]: (a[e.status] ?? 0) + 1 }), { pending: 0, prepared: 0, blocked: 0, failed: 0, canceled: 0 });

  return <GlassShell eyebrow="ShopReel" title="AI Operations" hidePageIntro><ShopReelNav />
    <div className="grid gap-5">
      <ShopReelPageHero title="AI Operations" subtitle="Control tower for execution lifecycle visibility, blocked tasks, and orchestration timelines." actions={[{ label: "Open campaigns", href: "/shopreel/campaigns", primary: true }, { label: "Open render queue", href: "/shopreel/render-queue" }]} />
      <section className="grid gap-3 md:grid-cols-5">{Object.entries(counts).map(([k,v]) => <GlassCard key={k} title={k}><div className="text-2xl font-semibold">{String(v)}</div></GlassCard>)}</section>
      <GlassCard title="Recent Executions" strong>{rows.map((r:any)=><div key={r.id} className="mb-2 rounded-xl border border-white/10 p-3 text-sm"><div className="flex gap-2"><GlassBadge>{r.status}</GlassBadge>{(r.status==="blocked"||r.status==="failed")&&<GlassBadge tone="copper">warning</GlassBadge>}</div><div>{r.execution_type} · {r.task?.title ?? "Untitled task"} · {r.campaignName ?? "Unknown campaign"}</div><div className="text-xs text-white/60">{new Date(r.updated_at).toLocaleString()} · readiness: {r.task?.status === "approved" ? "ready" : "check"}</div><div className="text-xs text-white/60">Latest event: {r.latestEvent?.event_type ?? "none"}</div></div>)}</GlassCard>
      <GlassCard title="Blocked Executions" strong>{rows.filter((r:any)=>r.status==="blocked"||r.status==="failed").map((r:any)=><div key={r.id} className="text-sm">{r.task?.title ?? r.id} · {r.status}</div>)}</GlassCard>
      <GlassCard title="AI Orchestration Timeline" strong>{(events??[]).map((e:any)=><div key={e.id} className="text-sm">{e.event_type} · {e.message ?? "no message"}</div>)}</GlassCard>
      <ShopReelActionRail title="Control tower rail" items={["Resolve blocked/failed executions first","Confirm readiness state before rerun","Use timeline events to diagnose orchestration drift","Escalate campaign-level issues to campaign detail"]} />
      <div><Link href="/shopreel/operations" className="text-xs text-white/70 underline">View canonical operations route</Link></div>
    </div></GlassShell>;
}
