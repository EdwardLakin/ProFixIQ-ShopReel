export const dynamic = "force-dynamic";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { AiWorkspaceStage } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import { deriveLifecycleStage, deriveNextBestAction } from "@/features/shopreel/publish/lifecycleReadModel";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import SurfaceExecutionHint from "@/features/shopreel/ui/system/SurfaceExecutionHint";
import { ShopReelOperationalLanes, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

const GROUPS = ["queued", "processing", "rendering", "ready", "failed"] as const;
type RenderJob = { id: string; status: string | null; content_piece_id: string | null };

export default async function ShopReelRenderQueuePage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("reel_render_jobs").select("id,status,content_piece_id").order("created_at", { ascending: false }).limit(80);
  const jobs: RenderJob[] = data ?? [];
  return <GlassShell title="Render Queue" hidePageIntro><div className="space-y-3"><EcosystemStateRail surface="render" /><SurfaceExecutionHint surface="render" /><AiWorkspaceStage title="Queue lanes"><ShopReelOperationalLanes>{GROUPS.map((status) => { const laneJobs = jobs.filter((j) => j.status === status); const critical = status === "failed" || status === "processing"; return <div key={status} className="min-w-[16rem] flex-1"><ShopReelSurface title={status} prominence={critical && laneJobs.length ? "elevated" : laneJobs.length ? "normal" : "recessed"} density={laneJobs.length > 6 ? "compact" : "balanced"}><div className="text-2xl text-white">{laneJobs.length}</div><div className="mt-2 space-y-1">{laneJobs.length === 0 ? <div className="rounded-xl bg-black/20 p-2 text-[11px] text-white/50">Nothing waiting.</div> : laneJobs.slice(0, 4).map((job) => { const stage = deriveLifecycleStage({ hasStoryboard: true, hasEditor: Boolean(job.content_piece_id), renderStatus: job.status, packageStatus: null, approvalState: null }); const action = deriveNextBestAction({ stage, blocked: false }); return <div key={job.id} className="rounded-xl bg-black/30 p-2 text-[11px] text-white/70">{job.content_piece_id ?? job.id.slice(0, 8)} · {action.label}</div>; })}</div></ShopReelSurface></div>; })}</ShopReelOperationalLanes></AiWorkspaceStage></div></GlassShell>;
}
