export const dynamic = "force-dynamic";

import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import RetryRenderButton from "@/features/shopreel/operations/components/RetryRenderButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { requireShopId } from "@/features/shopreel/server/requireShopId";
import { mapRenderJob } from "@/features/shopreel/render/renderJob";

function statusTone(status: string): "default" | "muted" | "copper" {
  if (status === "failed") return "copper";
  if (status === "queued" || status === "processing" || status === "ready") return "default";
  return "muted";
}

export default async function ShopReelRenderJobsPage() {
  const shopId = await requireShopId();
  const supabase = createAdminClient();

  const { data: jobsData } = await supabase
    .from("reel_render_jobs")
    .select("id, status, content_piece_id, render_payload, render_url, thumbnail_url, error_message, attempt_count, created_at, updated_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(100);

  const jobs = jobsData ?? [];
  const jobIds = jobs.map((job) => job.id);

  const generationByRenderJob = new Map<string, string>();
  if (jobIds.length > 0) {
    const { data: generationLinks } = await supabase
      .from("shopreel_story_generations")
      .select("id, render_job_id")
      .eq("shop_id", shopId)
      .in("render_job_id", jobIds);

    for (const row of generationLinks ?? []) {
      if (row.render_job_id) generationByRenderJob.set(row.render_job_id, row.id);
    }
  }

  const mapped = jobs.map((job) => mapRenderJob({ row: job, generationId: generationByRenderJob.get(job.id) }));

  return (
    <GlassShell eyebrow="ShopReel" title="Processing" subtitle="Track creation jobs as your drafts move from queue to ready.">
      <ShopReelNav />
      <GlassCard label="Pipeline" title="Queued, processing, ready, and failed jobs" strong>
        {mapped.length === 0 ? (
          <div className={cx("rounded-2xl border p-4 text-sm", glassTheme.border.softer, glassTheme.text.secondary)}>
            No processing jobs yet. Generate a draft to start creating output.
          </div>
        ) : (
          <div className="grid gap-3">
            {mapped.map((job) => (
              <div key={job.id} className={cx("grid gap-3 rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className={cx("text-base font-medium", glassTheme.text.primary)}>{job.title ?? "Render job"}</div>
                  <GlassBadge tone={statusTone(job.status)}>{job.status}</GlassBadge>
                </div>
                <div className={cx("text-xs", glassTheme.text.muted)}>
                  Created: {job.createdAt ?? "—"} · Updated: {job.updatedAt ?? "—"} · Attempts: {job.attemptCount}
                </div>
                <div className={cx("text-sm", glassTheme.text.secondary)}>
                  Generation: {job.generationId ?? "—"} · Content piece: {job.contentPieceId ?? "—"}
                </div>
                {job.failureMessage ? (
                  <div className={cx("text-sm", glassTheme.text.copperSoft)}>
                    Failure{job.failureCode ? ` (${job.failureCode})` : ""}: {job.failureMessage}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {job.generationId ? (
                    <Link href={`/shopreel/review/${job.generationId}`}><GlassButton variant="ghost">Open project</GlassButton></Link>
                  ) : null}
                  {job.status === "ready" && job.outputVideoPath ? (
                    <form action={`/api/shopreel/render-jobs/${job.id}/export-package`} method="post">
                      <GlassButton type="submit" variant="secondary">Create/open export package</GlassButton>
                    </form>
                  ) : null}
                  {job.status === "failed" && job.generationId ? <RetryRenderButton generationId={job.generationId} /> : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
