export const dynamic = "force-dynamic";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { AiWorkspaceStage } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import { deriveLifecycleStage, deriveNextBestAction } from "@/features/shopreel/publish/lifecycleReadModel";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";

const GROUPS = ["queued", "processing", "rendering", "ready", "failed"] as const;
type RenderJob = { id: string; status: string | null; content_piece_id: string | null };

export default async function ShopReelRenderQueuePage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("reel_render_jobs").select("id,status,content_piece_id").order("created_at", { ascending: false }).limit(80);
  const jobs: RenderJob[] = data ?? [];
  return <GlassShell title="Render Operations" hidePageIntro><div className="space-y-3"><EcosystemStateRail surface="render" /><AiWorkspaceStage title="Pipeline Lanes"><div className="grid gap-3 md:grid-cols-5">{GROUPS.map((status) => <div key={status} className="rounded-2xl bg-white/5 p-3"><div className="text-xs uppercase text-white/50">{status}</div><div className="mt-1 text-2xl text-white">{jobs.filter((j) => j.status === status).length}</div><div className="mt-2 space-y-1">{jobs.filter((j) => j.status === status).slice(0, 4).map((job) => { const stage = deriveLifecycleStage({ hasStoryboard: true, hasEditor: Boolean(job.content_piece_id), renderStatus: job.status, packageStatus: null, approvalState: null }); const action = deriveNextBestAction({ stage, blocked: false }); return <div key={job.id} className="rounded-xl bg-black/30 p-2 text-[11px] text-white/70">{job.content_piece_id ?? job.id.slice(0, 8)} · {action.label}</div>; })}</div></div>)}</div></AiWorkspaceStage></div></GlassShell>;
}
