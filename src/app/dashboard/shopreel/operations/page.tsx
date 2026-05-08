import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext } from "@/features/shopreel/server/endpointPolicy";
import {
  ShopReelActionRail,
  ShopReelPageHero,
  ShopReelSurface,
} from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default async function OperationsPage() {
  const { shopId } = await requireUserActionTenantContext();
  const db = createAdminClient() as any;

  const [{ data: executions }, { data: tasks }, { data: campaigns }, { data: events }] =
    await Promise.all([
      db.from("shopreel_agent_executions").select("id,status,execution_type,task_id,campaign_id,updated_at").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(30),
      db.from("shopreel_agent_tasks").select("id,title,status").eq("shop_id", shopId),
      db.from("shopreel_campaigns").select("id,title").eq("shop_id", shopId),
      db.from("shopreel_execution_events").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(30),
    ]);

  const taskMap = new Map((tasks ?? []).map((t: any) => [t.id, t]));
  const campaignMap = new Map((campaigns ?? []).map((c: any) => [c.id, c.title]));
  const eventMap = new Map<string, any>();

  for (const event of events ?? []) {
    if (!eventMap.has(event.execution_id)) eventMap.set(event.execution_id, event);
  }

  const rows = (executions ?? []).map((execution: any) => ({
    ...execution,
    task: taskMap.get(execution.task_id),
    campaignName: execution.campaign_id ? campaignMap.get(execution.campaign_id) : "No campaign",
    latestEvent: eventMap.get(execution.id),
  }));

  const counts = rows.reduce(
    (acc: Record<string, number>, row: any) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    { pending: 0, prepared: 0, blocked: 0, failed: 0, canceled: 0 },
  );

  const blockedRows = rows.filter((row: any) => row.status === "blocked" || row.status === "failed");

  return (
    <GlassShell eyebrow="ShopReel" title="AI Operations" hidePageIntro className="max-w-[1720px]">
      <div className="space-y-5">
        <ShopReelPageHero
          title="AI Operations"
          subtitle="Operator-controlled command center for approvals, execution readiness, blocked work, and orchestration timelines."
          actions={[
            { label: "Open campaigns", href: "/shopreel/campaigns", primary: true },
            { label: "Open render queue", href: "/shopreel/render-queue" },
          ]}
        />

        <section className="grid gap-3 md:grid-cols-5">
          {Object.entries(counts).map(([key, value]) => (
            <GlassCard key={key} title={key} label="Lifecycle">
              <div className="text-3xl font-semibold text-white">{String(value)}</div>
              <div className="mt-1 text-xs text-white/50">Execution records</div>
            </GlassCard>
          ))}
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ShopReelSurface
            title="Recent executions"
            description="Current orchestration records. These prepare work only; they do not auto-render or auto-publish."
          >
            <div className="space-y-3">
              {rows.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/60">
                  No execution records yet.
                </div>
              ) : (
                rows.map((row: any) => (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-cyan-950/10 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <GlassBadge tone={row.status === "failed" || row.status === "blocked" ? "copper" : "default"}>
                            {row.status}
                          </GlassBadge>
                          <GlassBadge tone="muted">{row.execution_type}</GlassBadge>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-white">
                          {row.task?.title ?? "Untitled task"}
                        </h3>
                        <p className="mt-1 text-sm text-white/60">{row.campaignName ?? "Unknown campaign"}</p>
                      </div>

                      <div className="text-right text-xs text-white/50">
                        {new Date(row.updated_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Readiness</div>
                        <div className="mt-1 text-sm text-white/75">
                          {row.task?.status === "approved" ? "Ready" : "Needs check"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Latest event</div>
                        <div className="mt-1 text-sm text-white/75">{row.latestEvent?.event_type ?? "none"}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Mode</div>
                        <div className="mt-1 text-sm text-white/75">Operator controlled</div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </ShopReelSurface>

          <aside className="space-y-5">
            <ShopReelActionRail
              title="Control tower rail"
              items={[
                "Resolve blocked or failed executions first.",
                "Confirm readiness before rerun.",
                "Use timeline events to diagnose orchestration drift.",
                "Escalate campaign-level issues to campaign detail.",
              ]}
            />

            <GlassCard title="Blocked executions" label="Attention" strong>
              <div className="space-y-2">
                {blockedRows.length === 0 ? (
                  <div className="text-sm text-white/60">No blocked executions.</div>
                ) : (
                  blockedRows.map((row: any) => (
                    <div key={row.id} className="rounded-xl border border-amber-300/20 bg-amber-500/5 p-3 text-sm text-white/80">
                      {row.task?.title ?? row.id}
                      <div className="mt-1 text-xs text-amber-200/80">{row.status}</div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </aside>
        </div>

        <ShopReelSurface title="AI orchestration timeline" description="Recent execution events across the workspace.">
          <div className="space-y-2">
            {(events ?? []).length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/60">
                No orchestration events yet.
              </div>
            ) : (
              (events ?? []).map((event: any) => (
                <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="text-white/80">{event.event_type}</div>
                  <div className="text-white/55">{event.message ?? "No message"}</div>
                  <div className="text-xs text-white/40">{new Date(event.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </ShopReelSurface>

        <Link href="/shopreel/operations" className="text-xs text-white/60 underline">
          View canonical operations route
        </Link>
      </div>
    </GlassShell>
  );
}
