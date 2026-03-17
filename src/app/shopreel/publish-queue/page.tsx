import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

function timeAgoLabel(value: string | null) {
  if (!value) return "Unknown";

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

function toneForStatus(status: string | null | undefined): "default" | "copper" | "muted" {
  if (status === "completed") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

export default async function ShopReelPublishQueuePage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: jobs } = await legacy
    .from("shopreel_publish_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Publish Queue"
      subtitle="Queued, processing, completed, and failed publish jobs."
    >
      <ShopReelNav />

      <GlassCard
        label="Queue"
        title="Outbound publishing jobs"
        description="This is the worker/job view behind publishing activity."
        strong
      >
        {(jobs ?? []).length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No publish jobs yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {(jobs ?? []).map((job: any) => (
              <div
                key={job.id}
                className={cx(
                  "rounded-2xl border p-4",
                  job.status === "processing"
                    ? glassTheme.border.copper
                    : glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      Publish Job
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      Publication: {job.publication_id ?? "unknown"}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      Created {timeAgoLabel(job.created_at ?? null)}
                    </div>
                    <div className={cx("text-xs", glassTheme.text.muted)}>
                      Attempts {job.attempt_count ?? 0}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <GlassBadge tone={toneForStatus(job.status)}>
                      {job.status ?? "queued"}
                    </GlassBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
