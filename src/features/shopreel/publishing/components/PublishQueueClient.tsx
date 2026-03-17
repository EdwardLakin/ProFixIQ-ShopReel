"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type PublishJobRow = {
  id: string;
  publication_id: string;
  status: string | null;
  attempt_count: number | null;
  created_at: string;
  updated_at: string;
};

type PublicationRow = {
  id: string;
  platform: string | null;
  status: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

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

function statusTone(status: string | null | undefined): "default" | "copper" | "muted" {
  if (status === "completed" || status === "published") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

export default function PublishQueueClient(props: {
  initialJobs: PublishJobRow[];
  initialQueuedPublicationsWithoutJobs: PublicationRow[];
}) {
  const { initialJobs, initialQueuedPublicationsWithoutJobs } = props;
  const router = useRouter();

  const [jobs] = useState<PublishJobRow[]>(initialJobs);
  const [missingPublications, setMissingPublications] = useState<PublicationRow[]>(
    initialQueuedPublicationsWithoutJobs
  );
  const [pendingPublicationId, setPendingPublicationId] = useState<string | null>(null);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCount = useMemo(
    () => jobs.length + missingPublications.length,
    [jobs.length, missingPublications.length]
  );

  async function enqueuePublication(publicationId: string) {
    try {
      setPendingPublicationId(publicationId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/publications/${publicationId}/enqueue`, {
        method: "POST",
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        alreadyQueued?: boolean;
      };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to enqueue publication");
      }

      setMissingPublications((current) =>
        current.filter((publication) => publication.id !== publicationId)
      );

      setMessage(
        json.alreadyQueued
          ? "Publish job already exists."
          : "Publish job queued."
      );

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enqueue publication");
    } finally {
      setPendingPublicationId(null);
    }
  }

  async function runJob(jobId: string) {
    try {
      setRunningJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/publish-jobs/${jobId}/run`, {
        method: "POST",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to run publish job");
      }

      setMessage("Publish worker executed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run publish job");
    } finally {
      setRunningJobId(null);
    }
  }

  return (
    <GlassCard
      label="Queue"
      title="Outbound publishing jobs"
      description="This is the worker/job view behind publishing activity."
      strong
      footer={
        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{totalCount} items</GlassBadge>
          {missingPublications.length > 0 ? (
            <GlassBadge tone="muted">{missingPublications.length} missing job</GlassBadge>
          ) : null}
        </div>
      }
    >
      {message ? (
        <div
          className={cx(
            "mb-4 rounded-2xl border p-4 text-sm",
            glassTheme.border.copper,
            glassTheme.glass.panelSoft,
            glassTheme.text.copperSoft
          )}
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          className={cx(
            "mb-4 rounded-2xl border p-4 text-sm",
            glassTheme.border.copper,
            glassTheme.glass.panelSoft,
            glassTheme.text.copperSoft
          )}
        >
          {error}
        </div>
      ) : null}

      {jobs.length === 0 && missingPublications.length === 0 ? (
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
          {jobs.map((job) => (
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
                    Publication: {job.publication_id}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    Created {timeAgoLabel(job.created_at)}
                  </div>
                  <div className={cx("text-xs", glassTheme.text.muted)}>
                    Attempts {job.attempt_count ?? 0}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <GlassBadge tone={statusTone(job.status)}>{job.status ?? "queued"}</GlassBadge>
                  {(job.status === "queued" || job.status === "failed") ? (
                    <GlassButton
                      variant="secondary"
                      onClick={() => void runJob(job.id)}
                      disabled={runningJobId === job.id}
                    >
                      {runningJobId === job.id ? "Running..." : "Run Now"}
                    </GlassButton>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {missingPublications.map((publication) => (
            <div
              key={publication.id}
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                    {(publication.metadata as any)?.title ?? publication.platform ?? "Queued publication"}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {publication.platform ?? "platform"} • queued {timeAgoLabel(publication.created_at)}
                  </div>
                  <div className={cx("text-xs", glassTheme.text.muted)}>
                    Publication exists but no publish job is attached yet.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <GlassBadge tone="default">{publication.status ?? "queued"}</GlassBadge>
                  <GlassButton
                    variant="secondary"
                    onClick={() => void enqueuePublication(publication.id)}
                    disabled={pendingPublicationId === publication.id}
                  >
                    {pendingPublicationId === publication.id ? "Queueing..." : "Queue Job"}
                  </GlassButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
