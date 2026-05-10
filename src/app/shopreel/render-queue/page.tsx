export const dynamic = "force-dynamic";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import SurfaceExecutionHint from "@/features/shopreel/ui/system/SurfaceExecutionHint";

export default async function RenderQueuePage() {
  const supabase = createAdminClient() as unknown as { from: (table: string) => { select: (q: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Array<{ id: string; status: string; error_message: string | null }> | null }> } } };
  const { data } = await supabase.from("reel_render_jobs").select("id,status,error_message").order("created_at", { ascending: false });
  const jobs = data ?? [];
  const by = (s: string) => jobs.filter((j) => j.status === s);
  return <GlassShell title="Render queue" hidePageIntro><div className="space-y-4"><EcosystemStateRail surface="render" /><SurfaceExecutionHint surface="render" />{(["processing", "queued", "failed", "completed"] as const).map((status) => <ShopReelSurface key={status} title={status[0].toUpperCase() + status.slice(1)} description={`${by(status).length} jobs`}>{by(status).length ? <div className="space-y-2">{by(status).slice(0, 8).map((job) => <div key={job.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-2 text-sm text-white/80"><span>{job.id.slice(0, 8)}</span><span>{job.error_message ? "Retry needed" : "In progress"}</span></div>)}</div> : <p className="text-sm text-white/60">No jobs.</p>}</ShopReelSurface>)}</div></GlassShell>;
}
