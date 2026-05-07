import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeVideoJobStatus } from "@/features/shopreel/video-creation/lib/status";

export default async function VideoGenerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: job } = await supabase.from("shopreel_media_generation_jobs").select("*").eq("id", id).maybeSingle();
  if (!job) return <GlassShell title="Generation not found" subtitle="This job could not be found."><div /></GlassShell>;
  const status = normalizeVideoJobStatus(job.status);
  const timeline = [
    ["Created", job.created_at], ["Submitted", (job as any).submitted_at ?? job.created_at], ["Started", job.started_at], ["Completed", job.completed_at], ["Updated", job.updated_at],
  ];

  return <GlassShell title="Generation job" subtitle="Lifecycle, output preview, and retry actions.">
    <div className="space-y-4">
      <GlassCard title={job.title ?? "Untitled video"} label="Hero" strong>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
          <div className="flex items-center gap-2"><span>Status</span><GlassBadge tone={status === "completed" ? "copper" : status === "failed" ? "muted" : "default"}>{status}</GlassBadge></div>
          <div>{job.provider} · {job.aspect_ratio}</div>
          <div>{job.duration_seconds ?? "n/a"}s</div>
        </div>
      </GlassCard>
      <div className="grid gap-4 xl:grid-cols-2">
        <GlassCard title="Lifecycle timeline" label="Timestamps">{timeline.map(([k,v]) => <div key={String(k)} className="flex justify-between border-b border-white/5 py-2 text-sm text-white/80"><span>{k}</span><span>{v ?? "—"}</span></div>)}</GlassCard>
        <GlassCard title="Prompt + plan" label="Input"><div className="space-y-2 text-sm text-white/80"><div>{job.prompt ?? "No prompt submitted"}</div><div>Enhanced: {job.prompt_enhanced ?? "None"}</div><div>Style: {job.style ?? "default"}</div></div></GlassCard>
      </div>
      <GlassCard title="Output preview" label="Preview">{job.preview_url ? <video controls className="w-full rounded-2xl" src={job.preview_url} /> : <div className="text-sm text-white/70">No preview yet.</div>}</GlassCard>
      <GlassCard title="Advanced payload" label="Debug"><details><summary className="cursor-pointer text-xs text-white/80">Expand debug payload</summary><pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-black/35 p-2 text-[11px] text-white/70">{JSON.stringify(job.result_payload ?? {}, null, 2)}</pre></details></GlassCard>
      <div className="flex flex-wrap gap-2">
        <Link href="/shopreel/render-queue"><GlassButton variant="secondary">Back to queue</GlassButton></Link>
        <Link href="/shopreel/video-creation"><GlassButton variant="ghost">Retry render</GlassButton></Link>
        <Link href="/shopreel/create"><GlassButton variant="ghost">Create variation</GlassButton></Link>
      </div>
    </div>
  </GlassShell>;
}
