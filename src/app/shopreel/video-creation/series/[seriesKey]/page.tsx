import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { listMediaJobsForSeries, getMediaJobSeriesInfo } from "@/features/shopreel/video-creation/lib/series";
import { getMediaJobPrimaryAction } from "@/features/shopreel/video-creation/lib/editor";

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

function statusTone(status: string): "default" | "copper" | "muted" {
  if (status === "completed") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

export default async function ShopReelSeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesKey: string }>;
}) {
  const { seriesKey } = await params;
  const jobs = await listMediaJobsForSeries(seriesKey);
  const header = jobs[0];
  const headerInfo = header ? getMediaJobSeriesInfo(header) : null;

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={headerInfo?.seriesTitle ?? "Series"}
      subtitle="Review all clips in this series in one place."
    >
      <div className="grid gap-5">
        <GlassCard
          label="Series"
          title={headerInfo?.seriesTitle ?? "Untitled series"}
          description={
            headerInfo?.sourceMode === "assets"
              ? "Uploaded-media-first series."
              : "AI concept series."
          }
          strong
        >
          <div className="flex flex-wrap gap-2">
            <GlassBadge tone="default">{jobs.length} clips</GlassBadge>
            {headerInfo?.sourceMode ? (
              <GlassBadge tone="muted">
                {headerInfo.sourceMode === "assets" ? "Uploaded media" : "AI concepts"}
              </GlassBadge>
            ) : null}
            <Link href="/shopreel/video-creation">
              <GlassButton variant="ghost">Back to Video Creation</GlassButton>
            </Link>
          </div>
        </GlassCard>

        {jobs.length === 0 ? (
          <GlassCard
            label="Empty"
            title="No clips found"
            description="This series does not have any jobs yet."
            strong
          />
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => {
              const info = getMediaJobSeriesInfo(job);
              const primaryAction = getMediaJobPrimaryAction(job);

              return (
                <GlassCard
                  key={job.id}
                  label={info.sceneLabel ?? "Clip"}
                  title={`${info.sceneOrder ?? "?"}. ${info.sceneLabel ?? job.title ?? "Untitled clip"}`}
                  description={`Created ${timeAgoLabel(job.created_at)}`}
                  strong
                >
                  <div className="grid gap-4">
                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone={statusTone(job.status)}>{job.status}</GlassBadge>
                      <GlassBadge tone="default">{job.aspect_ratio}</GlassBadge>
                      {job.style ? <GlassBadge tone="muted">{job.style}</GlassBadge> : null}
                      {job.visual_mode ? <GlassBadge tone="muted">{job.visual_mode}</GlassBadge> : null}
                      {job.output_asset_id ? <GlassBadge tone="copper">Asset ready</GlassBadge> : null}
                    </div>

                    {job.preview_url ? (
                      <video
                        src={job.preview_url}
                        controls
                        playsInline
                        className="max-h-80 rounded-2xl border border-white/10"
                      />
                    ) : null}

                    {job.error_text ? (
                      <div className="text-sm text-red-300">{job.error_text}</div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {primaryAction.href && primaryAction.label ? (
                        <Link href={primaryAction.href}>
                          <GlassButton variant="primary">{primaryAction.label}</GlassButton>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </GlassShell>
  );
}
