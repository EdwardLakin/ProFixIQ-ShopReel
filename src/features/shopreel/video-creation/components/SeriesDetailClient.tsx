"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import {
  getMediaJobSeriesInfo,
  groupMediaJobsIntoSeries,
} from "@/features/shopreel/video-creation/lib/seriesClient";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

function statusTone(status: string): "default" | "copper" | "muted" {
  if (status === "completed") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

export default function SeriesDetailClient({
  seriesKey,
  jobs,
}: {
  seriesKey: string;
  jobs: MediaJob[];
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const series = useMemo(() => {
    const groups = groupMediaJobsIntoSeries(jobs);
    return groups.find((group) => group.key === seriesKey) ?? null;
  }, [jobs, seriesKey]);

  const runnableJobs = useMemo(
    () => jobs.filter((job) => job.status === "queued" || job.status === "failed"),
    [jobs]
  );

  const syncableJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.provider === "openai" &&
          job.job_type === "video" &&
          job.status === "processing"
      ),
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === "completed"),
    [jobs]
  );

  async function runAll() {
    try {
      if (runnableJobs.length === 0) {
        setMessage("Nothing to run.");
        return;
      }

      setRunning(true);
      setError(null);
      setMessage(null);

      await Promise.all(
        runnableJobs.map(async (job) => {
          const res = await fetch(`/api/shopreel/video-creation/jobs/${job.id}/run`, {
            method: "POST",
          });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.ok) {
            throw new Error(json?.error ?? `Failed to run ${job.title ?? job.id}`);
          }
        })
      );

      setMessage("Series run started.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run series");
    } finally {
      setRunning(false);
    }
  }

  async function syncAll() {
    try {
      if (syncableJobs.length === 0) {
        setMessage("Nothing to sync.");
        return;
      }

      setSyncing(true);
      setError(null);
      setMessage(null);

      await Promise.all(
        syncableJobs.map(async (job) => {
          const res = await fetch(`/api/shopreel/video-creation/jobs/${job.id}/sync`, {
            method: "POST",
          });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.ok) {
            throw new Error(json?.error ?? `Failed to sync ${job.title ?? job.id}`);
          }
        })
      );

      setMessage("Series synced.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync series");
    } finally {
      setSyncing(false);
    }
  }

  async function runOne(jobId: string) {
    try {
      setRunningJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/run`, {
        method: "POST",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Failed to run clip");
      }

      setMessage("Clip run started.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run clip");
    } finally {
      setRunningJobId(null);
    }
  }

  async function syncOne(jobId: string) {
    try {
      setSyncingJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/sync`, {
        method: "POST",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Failed to sync clip");
      }

      setMessage("Clip synced.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync clip");
    } finally {
      setSyncingJobId(null);
    }
  }

  async function deleteSeries() {
    const confirmed = window.confirm("Delete this whole series and all clips in it?");
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/series/${seriesKey}/delete`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete series");
      }

      router.push("/shopreel/video-creation");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete series");
    } finally {
      setDeleting(false);
    }
  }

  if (!series) {
    return (
      <GlassCard
        label="Series"
        title="Series not found"
        description="This grouped series could not be loaded."
        strong
      >
        <Link href="/shopreel/video-creation">
          <GlassButton variant="primary">Back to video creation</GlassButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Series"
        title={series.title}
        description="Manage all clips in this grouped series from one place."
        strong
      >
        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{series.completedCount} completed</GlassBadge>
          <GlassBadge tone="default">{series.processingCount} processing</GlassBadge>
          <GlassBadge tone="default">{series.queuedCount} queued</GlassBadge>
          {series.failedCount > 0 ? (
            <GlassBadge tone="muted">{series.failedCount} failed</GlassBadge>
          ) : null}
          {series.sourceMode ? (
            <GlassBadge tone="muted">
              {series.sourceMode === "assets" ? "Uploaded media" : "AI concepts"}
            </GlassBadge>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {runnableJobs.length > 0 ? (
            <GlassButton variant="primary" onClick={() => void runAll()} disabled={running}>
              {running ? "Running..." : `Run all (${runnableJobs.length})`}
            </GlassButton>
          ) : null}

          {syncableJobs.length > 0 ? (
            <GlassButton variant="secondary" onClick={() => void syncAll()} disabled={syncing}>
              {syncing ? "Syncing..." : `Sync all (${syncableJobs.length})`}
            </GlassButton>
          ) : null}

          <GlassButton variant="ghost" onClick={() => void deleteSeries()} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete series"}
          </GlassButton>

          <Link href="/shopreel/video-creation">
            <GlassButton variant="ghost">Back</GlassButton>
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div
            className={cx(
              "rounded-2xl border p-3",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft
            )}
          >
            <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Ready to run
            </div>
            <div className={cx("mt-2 text-2xl font-semibold", glassTheme.text.primary)}>
              {runnableJobs.length}
            </div>
          </div>

          <div
            className={cx(
              "rounded-2xl border p-3",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft
            )}
          >
            <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Processing now
            </div>
            <div className={cx("mt-2 text-2xl font-semibold", glassTheme.text.primary)}>
              {syncableJobs.length}
            </div>
          </div>

          <div
            className={cx(
              "rounded-2xl border p-3",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft
            )}
          >
            <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Completed
            </div>
            <div className={cx("mt-2 text-2xl font-semibold", glassTheme.text.primary)}>
              {completedJobs.length}
            </div>
          </div>
        </div>

        {message ? <div className="mt-4 text-sm text-white/70">{message}</div> : null}
        {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}
      </GlassCard>

      <GlassCard
        label="Clips"
        title="Series clips"
        description="Each clip in this series is listed below."
        strong
      >
        <div className="grid gap-3">
          {jobs.map((job) => {
            const info = getMediaJobSeriesInfo(job);
            const canRun = job.status === "queued" || job.status === "failed";
            const canSync =
              job.provider === "openai" &&
              job.job_type === "video" &&
              job.status === "processing";

            return (
              <div
                key={job.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {info.sceneOrder ? `${info.sceneOrder}. ` : ""}
                      {info.sceneLabel ?? job.title ?? "Untitled clip"}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone={statusTone(job.status)}>{job.status}</GlassBadge>
                      <GlassBadge tone="muted">{job.aspect_ratio}</GlassBadge>
                      {job.style ? <GlassBadge tone="muted">{job.style}</GlassBadge> : null}
                      {job.visual_mode ? (
                        <GlassBadge tone="muted">{job.visual_mode}</GlassBadge>
                      ) : null}
                    </div>

                    {job.error_text ? (
                      <div className="text-sm text-red-300">{job.error_text}</div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {canRun ? (
                      <GlassButton
                        variant="secondary"
                        onClick={() => void runOne(job.id)}
                        disabled={runningJobId === job.id}
                      >
                        {runningJobId === job.id ? "Running..." : "Run"}
                      </GlassButton>
                    ) : null}

                    {canSync ? (
                      <GlassButton
                        variant="secondary"
                        onClick={() => void syncOne(job.id)}
                        disabled={syncingJobId === job.id}
                      >
                        {syncingJobId === job.id ? "Syncing..." : "Sync"}
                      </GlassButton>
                    ) : null}
                  </div>
                </div>

                {job.preview_url ? (
                  <div className="mt-4">
                    <video
                      src={job.preview_url}
                      controls
                      playsInline
                      className="max-h-56 rounded-2xl border border-white/10"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
