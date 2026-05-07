export const dynamic = "force-dynamic";

import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { createAdminClient } from "@/lib/supabase/server";
import { ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import StatusBadge from "@/features/shopreel/components/StatusBadge";

const GROUPS = ["queued", "processing", "rendering", "ready", "failed"] as const;

function timeLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export default async function ShopReelRenderQueuePage() {
  const supabase = createAdminClient() as any;
  const { data } = await supabase.from("reel_render_jobs").select("*").order("created_at", { ascending: false }).limit(80);
  const jobs = data ?? [];

  return (
    <GlassShell title="Render Queue" subtitle="Live orchestration surface for rendering lifecycle and retries." actions={<div className="flex gap-2"><Link href="/shopreel/generations"><GlassButton variant="ghost">Open Generations</GlassButton></Link><GlassButton variant="secondary">Refresh queue</GlassButton></div>}>
      <ShopReelNav />
      <section className="sticky top-4 z-10 rounded-2xl border border-white/10 bg-slate-950/80 p-3 backdrop-blur">
        <div className="grid gap-2 sm:grid-cols-5">{GROUPS.map((s)=><div key={s} className="rounded-xl border border-white/10 bg-black/30 p-2 text-center"><p className="text-[11px] uppercase tracking-wide text-white/60">{s}</p><p className="text-lg font-semibold text-white">{jobs.filter((j:any)=>j.status===s).length}</p></div>)}</div>
      </section>
      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        {GROUPS.map((status) => {
          const inGroup = jobs.filter((job: any) => job.status === status);
          return (
            <ShopReelSurface key={status} title={status[0].toUpperCase() + status.slice(1)} description={`${inGroup.length} jobs`}>
              <div className="space-y-2">
                {inGroup.length === 0 ? <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/55">No jobs in this stage.</div> : inGroup.map((job: any) => (
                  <div key={job.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white/65">{job.provider ?? "provider: unknown"}</p>
                      <StatusBadge label={job.status} variant={job.status === "failed" ? "warn" : job.status === "ready" ? "good" : "neutral"} />
                    </div>
                    <p className="mt-2 text-sm text-white">{job.content_piece_id ?? "No content piece linked"}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-white/60">
                      <span className="rounded-md border border-white/10 px-2 py-0.5">{job.aspect_ratio ?? "ratio n/a"}</span>
                      <span className="rounded-md border border-white/10 px-2 py-0.5">{job.duration_seconds ? `${job.duration_seconds}s` : "duration n/a"}</span>
                      <span className="rounded-md border border-white/10 px-2 py-0.5">Attempt {job.attempt_count ?? 0}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/50">Created {timeLabel(job.created_at)}</p>
                    {job.updated_at ? <p className="text-[11px] text-white/50">Updated {timeLabel(job.updated_at)}</p> : null}
                    {job.error_message ? <p className="mt-2 rounded-md border border-rose-400/30 bg-rose-500/10 p-2 text-xs text-rose-200">{job.error_message}</p> : null}
                  </div>
                ))}
              </div>
            </ShopReelSurface>
          );
        })}
      </div>
    </GlassShell>
  );
}
