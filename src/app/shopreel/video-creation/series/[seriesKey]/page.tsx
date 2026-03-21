import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  getMediaJobSeriesInfo,
  groupMediaJobsIntoSeries,
} from "@/features/shopreel/video-creation/lib/seriesClient";
import { getMediaJobPrimaryAction } from "@/features/shopreel/video-creation/lib/editor";

type Params = Promise<{ seriesKey: string }>;

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

export default async function SeriesDetailPage({
  params,
}: {
  params: Params;
}) {
  const { seriesKey } = await params;
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const groups = groupMediaJobsIntoSeries(data ?? []);
  const group = groups.find((item) => item.key === seriesKey);

  if (!group) {
    return (
      <GlassShell
        eyebrow="ShopReel"
        title="Series not found"
        subtitle="The requested series could not be found."
      >
        <GlassCard
          label="Series"
          title="Missing series"
          description="Go back to Video Creation and create or open another series."
          strong
        >
          <Link href="/shopreel/video-creation">
            <GlassButton variant="primary">Back to Video Creation</GlassButton>
          </Link>
        </GlassCard>
      </GlassShell>
    );
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={group.title}
      subtitle="Review the grouped clips for this series."
    >
      <div className="grid gap-5">
        <GlassCard
          label="Series"
          title={group.title}
          description={`Created ${timeAgoLabel(group.jobs[0]?.created_at ?? new Date().toISOString())}`}
          strong
        >
          <div className="flex flex-wrap gap-2">
            <GlassBadge tone="default">{group.completedCount} completed</GlassBadge>
            <GlassBadge tone="default">{group.processingCount} processing</GlassBadge>
            <GlassBadge tone="default">{group.queuedCount} queued</GlassBadge>
            {group.failedCount > 0 ? <GlassBadge tone="muted">{group.failedCount} failed</GlassBadge> : null}
            <GlassBadge tone="muted">
              {group.sourceMode === "assets" ? "Uploaded media" : "AI concepts"}
            </GlassBadge>
          </div>

          <div className="mt-4">
            <Link href="/shopreel/video-creation">
              <GlassButton variant="secondary">Back to Video Creation</GlassButton>
            </Link>
          </div>
        </GlassCard>

        <GlassCard
          label="Clips"
          title="Series clips"
          description="Each clip remains editable and reviewable on its own."
          strong
        >
          <div className="grid gap-4">
            {group.jobs.map((job) => {
              const info = getMediaJobSeriesInfo(job);
              const primaryAction = getMediaJobPrimaryAction(job);

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-base font-medium text-white">
                        {info.sceneOrder ? `${info.sceneOrder}. ` : ""}
                        {info.sceneLabel ?? job.title ?? "Untitled clip"}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <GlassBadge tone={statusTone(job.status)}>{job.status}</GlassBadge>
                        <GlassBadge tone="muted">{job.aspect_ratio}</GlassBadge>
                        {job.style ? <GlassBadge tone="muted">{job.style}</GlassBadge> : null}
                        {job.visual_mode ? <GlassBadge tone="muted">{job.visual_mode}</GlassBadge> : null}
                        {job.output_asset_id ? <GlassBadge tone="copper">Asset ready</GlassBadge> : null}
                      </div>

                      {job.preview_url ? (
                        <video
                          src={job.preview_url}
                          controls
                          playsInline
                          className="max-h-64 rounded-2xl border border-white/10"
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {primaryAction.href && primaryAction.label ? (
                        <Link href={primaryAction.href}>
                          <GlassButton variant="ghost">{primaryAction.label}</GlassButton>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </GlassShell>
  );
}
