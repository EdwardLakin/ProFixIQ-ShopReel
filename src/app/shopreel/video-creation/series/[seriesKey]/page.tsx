import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getMediaJobPrimaryAction } from "@/features/shopreel/video-creation/lib/editor";
import { getMediaJobSeriesInfo } from "@/features/shopreel/video-creation/lib/series";
import { listMediaJobsForSeriesKey } from "@/features/shopreel/video-creation/lib/seriesServer";

function statusTone(status: string): "default" | "copper" | "muted" {
  if (status === "completed") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

export default async function ShopReelSeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesKey: string }>;
}) {
  const { seriesKey } = await params;
  const jobs = await listMediaJobsForSeriesKey(seriesKey);

  const title =
    jobs.length > 0
      ? getMediaJobSeriesInfo(jobs[0]).seriesTitle ?? jobs[0].title ?? "Series"
      : "Series";

  const totalScenes = jobs.length;
  const completedCount = jobs.filter((job) => job.status === "completed").length;
  const processingCount = jobs.filter((job) => job.status === "processing").length;
  const queuedCount = jobs.filter((job) => job.status === "queued").length;
  const failedCount = jobs.filter((job) => job.status === "failed").length;

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={title}
      subtitle="Series detail view for grouped clips, previews, and next actions."
    >
      <div className="grid gap-5">
        <GlassCard
          label="Overview"
          title="Series Status"
          description="Review the full sequence in one place."
          strong
        >
          <div className="flex flex-wrap gap-2">
            <GlassBadge tone="default">{totalScenes} clips</GlassBadge>
            <GlassBadge tone="copper">{completedCount} completed</GlassBadge>
            <GlassBadge tone="default">{processingCount} processing</GlassBadge>
            <GlassBadge tone="default">{queuedCount} queued</GlassBadge>
            {failedCount > 0 ? <GlassBadge tone="muted">{failedCount} failed</GlassBadge> : null}
          </div>

          <div className="mt-4">
            <Link href="/shopreel/video-creation">
              <GlassButton variant="ghost">Back to Video Creation</GlassButton>
            </Link>
          </div>
        </GlassCard>

        <GlassCard
          label="Clips"
          title="Series Clips"
          description="Each clip remains individually editable and reviewable."
          strong
        >
          {jobs.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary
              )}
            >
              No clips found for this series.
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => {
                const info = getMediaJobSeriesInfo(job);
                const primaryAction = getMediaJobPrimaryAction(job);

                return (
                  <div
                    key={job.id}
                    className={cx(
                      "rounded-2xl border p-4",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                          {info.sceneOrder ? `${info.sceneOrder}. ` : ""}
                          {info.sceneLabel ?? job.title ?? "Untitled clip"}
                        </div>

                        <div className={cx("text-sm", glassTheme.text.secondary)}>
                          {job.provider} • {job.job_type} • {timeAgoLabel(job.created_at)}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <GlassBadge tone={statusTone(job.status)}>{job.status}</GlassBadge>
                          <GlassBadge tone="default">{job.aspect_ratio}</GlassBadge>
                          {job.style ? <GlassBadge tone="muted">{job.style}</GlassBadge> : null}
                          {job.visual_mode ? <GlassBadge tone="muted">{job.visual_mode}</GlassBadge> : null}
                          {job.output_asset_id ? <GlassBadge tone="copper">Asset ready</GlassBadge> : null}
                        </div>

                        {job.error_text ? (
                          <div className={cx("text-sm", glassTheme.text.copperSoft)}>
                            {job.error_text}
                          </div>
                        ) : null}

                        {job.prompt ? (
                          <div className={cx("text-sm leading-6", glassTheme.text.secondary)}>
                            {job.prompt}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-3 sm:items-end">
                        {job.preview_url ? (
                          <video
                            src={job.preview_url}
                            controls
                            playsInline
                            className="max-h-56 rounded-2xl border border-white/10"
                          />
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {primaryAction.href && primaryAction.label ? (
                            <Link href={primaryAction.href}>
                              <GlassButton variant="secondary">{primaryAction.label}</GlassButton>
                            </Link>
                          ) : null}

                          {job.output_asset_id && job.source_content_piece_id ? (
                            <Link href={`/shopreel/content/${job.source_content_piece_id}`}>
                              <GlassButton variant="ghost">Open content</GlassButton>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </GlassShell>
  );
}
