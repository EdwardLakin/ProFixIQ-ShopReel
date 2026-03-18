import Link from "next/link";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

function timeLabel(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function OperatorDashboard(props: {
  summary: {
    queuedJobsCount: number;
    processingJobsCount: number;
    activeCampaignsCount: number;
    learningsCount: number;
    lastAutomationRun: {
      id: string;
      status: string;
      started_at: string;
      completed_at: string | null;
      synced_jobs_count: number;
      learnings_count: number;
    } | null;
  };
  latestRuns: Array<{
    id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    synced_jobs_count: number;
    learnings_count: number;
  }>;
  latestJobs: Array<{
    id: string;
    title: string | null;
    status: string;
    provider: string;
    job_type: string;
    created_at: string;
    updated_at: string;
  }>;
  latestCampaigns: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
}) {
  const { summary, latestRuns, latestJobs, latestCampaigns } = props;

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Jobs waiting", summary.queuedJobsCount],
          ["Jobs processing", summary.processingJobsCount],
          ["Campaigns active", summary.activeCampaignsCount],
          ["Learnings produced", summary.learningsCount],
          ["Last run", summary.lastAutomationRun?.status ?? "none"],
        ].map(([label, value]) => {
          const title = String(label);
          return (
            <GlassCard key={title} label="Summary" title={title} strong>
              <div className={cx("text-2xl font-semibold", glassTheme.text.primary)}>
                {String(value)}
              </div>
            </GlassCard>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <GlassCard
          label="Automation"
          title="Recent automation runs"
          description="Latest loop executions and health."
          strong
        >
          <div className="grid gap-3">
            {latestRuns.length === 0 ? (
              <div className={cx("text-sm", glassTheme.text.secondary)}>No automation runs yet.</div>
            ) : (
              latestRuns.map((run) => (
                <div
                  key={run.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-wrap gap-2">
                    <GlassBadge tone={run.status === "completed" ? "copper" : "default"}>
                      {run.status}
                    </GlassBadge>
                  </div>
                  <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                    Started: {timeLabel(run.started_at)}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    Completed: {timeLabel(run.completed_at)}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    Synced jobs: {run.synced_jobs_count} • Learnings: {run.learnings_count}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard
          label="Jobs"
          title="Latest media jobs"
          description="Newest activity in the render/generation pipeline."
          strong
        >
          <div className="grid gap-3">
            {latestJobs.map((job) => (
              <div
                key={job.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                  {job.title ?? "Untitled job"}
                </div>
                <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                  {job.provider} • {job.job_type}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <GlassBadge tone={job.status === "completed" ? "copper" : "default"}>
                    {job.status}
                  </GlassBadge>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="Campaigns"
          title="Latest campaigns"
          description="Recent campaigns in the autonomous marketing loop."
          strong
        >
          <div className="grid gap-3">
            {latestCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/shopreel/campaigns/${campaign.id}`}
                className={cx(
                  "rounded-2xl border p-4 block",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                  {campaign.title}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <GlassBadge tone="default">{campaign.status}</GlassBadge>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
