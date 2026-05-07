import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeVideoJobStatus } from "@/features/shopreel/video-creation/lib/status";

export default async function VideoGenerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: job } = await supabase.from("shopreel_media_generation_jobs").select("*").eq("id", id).maybeSingle();

  if (!job) {
    return <GlassShell title="Generation not found" subtitle="This video generation job could not be found."><div /></GlassShell>;
  }

  const status = normalizeVideoJobStatus(job.status);

  return (
    <GlassShell title="Video generation detail" subtitle="Rendering status, payload summary, and outputs.">
      <div className="space-y-4">
        <GlassCard title={job.title ?? "Untitled video"} label="Status" strong>
          <div className="grid gap-2 text-sm text-white/80">
            <div>Status: {status}</div>
            <div>Created: {job.created_at}</div>
            <div>Submitted: {(job as any).submitted_at ?? job.created_at}</div>
            <div>Started: {job.started_at ?? "Not started"}</div>
            <div>Completed: {job.completed_at ?? "Not completed"}</div>
            <div>Last updated: {job.updated_at}</div>
          </div>
        </GlassCard>
        <GlassCard title="Prompt + plan summary" label="Input">
          <div className="space-y-2 text-sm text-white/80">
            <div>{job.prompt ?? "No prompt submitted"}</div>
            <div>Enhanced prompt: {job.prompt_enhanced ?? "None"}</div>
            <div>Style: {job.style ?? "default"}</div>
            <div>Aspect ratio: {job.aspect_ratio}</div>
            <div>Duration: {job.duration_seconds ?? "n/a"}s</div>
            <div>Media selected: {(job.input_asset_ids ?? []).length}</div>
          </div>
        </GlassCard>
        <GlassCard title="Advanced details" label="Debug">
          <details>
            <summary className="cursor-pointer text-xs text-white/80">Expand debug payload</summary>
            <div className="mt-2 text-xs text-white/70">Railway job id: {job.provider_job_id ?? "Not yet assigned"}</div>
            <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-black/35 p-2 text-[11px] text-white/70">{JSON.stringify(job.result_payload ?? {}, null, 2)}</pre>
          </details>
        </GlassCard>
        {job.preview_url ? <video controls className="w-full rounded-2xl" src={job.preview_url} /> : null}
        <div className="flex gap-2">
          <Link href="/shopreel/video-creation"><GlassButton variant="ghost">Retry render from brief</GlassButton></Link>
          <Link href="/shopreel/video-creation"><GlassButton variant="ghost">Create new video</GlassButton></Link>
          <Link href="/shopreel/create"><GlassButton variant="ghost">Create variation</GlassButton></Link>
          <Link href="/shopreel/render-queue"><GlassButton variant="secondary">Open render queue</GlassButton></Link>
        </div>
      </div>
    </GlassShell>
  );
}
