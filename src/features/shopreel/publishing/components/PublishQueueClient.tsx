"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type PublishJobRow = {
  id: string;
  publication_id: string;
  status: string | null;
  attempt_count: number | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string | null;
  completed_at?: string | null;
};

type PublicationRow = {
  id: string;
  platform: string | null;
  status: string | null;
  created_at: string;
  updated_at?: string | null;
  error_text?: string | null;
  content_piece_id?: string | null;
  platform_post_url?: string | null;
  metadata?: Record<string, unknown> | null;
};

type PublicationDiagnosticRow = {
  publication: PublicationRow;
  publishJob: PublishJobRow | null;
  contentPieceId: string | null;
  generationId: string | null;
  diagnostics: {
    reason: string;
    reasonLabel: string;
    retryable: boolean;
    retryabilityLabel: string;
    summary: string;
    lastAttemptedAt: string | null;
    currentPublicationStatus: string;
    currentPublishJobStatus: string | null;
  };
  nextAction: {
    label: string;
    href: string;
  };
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
  initialDiagnostics: PublicationDiagnosticRow[];
}) {
  const { initialJobs, initialQueuedPublicationsWithoutJobs, initialDiagnostics } = props;
  const router = useRouter();

  const [jobs] = useState<PublishJobRow[]>(initialJobs);
  const [diagnostics] = useState<PublicationDiagnosticRow[]>(initialDiagnostics);
  const [missingPublications, setMissingPublications] = useState<PublicationRow[]>(
    initialQueuedPublicationsWithoutJobs
  );
  const [pendingPublicationId, setPendingPublicationId] = useState<string | null>(null);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCount = useMemo(() => jobs.length + missingPublications.length, [jobs.length, missingPublications.length]);
  const failedCount = useMemo(
    () => diagnostics.filter((row) => row.diagnostics.currentPublicationStatus === "failed").length,
    [diagnostics]
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
                  {job.status === "queued" ? (
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

      <div className="mt-6 border-t border-white/10 pt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <GlassBadge tone={failedCount > 0 ? "muted" : "default"}>{failedCount} failed publication(s)</GlassBadge>
          <GlassBadge tone="default">{diagnostics.length} publication(s) with diagnostic state</GlassBadge>
        </div>

        {diagnostics.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No publication diagnostics available.
          </div>
        ) : (
          <div className="grid gap-3">
            {diagnostics.map((row) => (
              <div
                key={row.publication.id}
                className={cx("rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {(row.publication.metadata as any)?.title ?? row.publication.platform ?? "Publication"}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      Publication {row.diagnostics.currentPublicationStatus}
                      {row.diagnostics.currentPublishJobStatus ? ` • Job ${row.diagnostics.currentPublishJobStatus}` : ""}
                    </div>
                    <div className={cx("text-xs", glassTheme.text.muted)}>
                      Last attempted {timeAgoLabel(row.diagnostics.lastAttemptedAt)}
                    </div>
                    <div className={cx("text-xs", glassTheme.text.secondary)}>
                      Reason: {row.diagnostics.reasonLabel} • {row.diagnostics.retryabilityLabel}
                    </div>
                    <div className={cx("text-xs", glassTheme.text.muted)}>{row.diagnostics.summary}</div>
                  </div>
                  <GlassBadge tone={row.diagnostics.retryable ? "default" : "muted"}>
                    {row.diagnostics.retryable ? "retryable" : "blocked"}
                  </GlassBadge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {row.diagnostics.retryable ? (
                    <GlassButton
                      variant="secondary"
                      onClick={() => void enqueuePublication(row.publication.id)}
                      disabled={pendingPublicationId === row.publication.id}
                    >
                      {pendingPublicationId === row.publication.id ? "Queueing..." : "Retry publish"}
                    </GlassButton>
                  ) : null}
                  <Link href={row.nextAction.href}>
                    <GlassButton variant="ghost">{row.nextAction.label}</GlassButton>
                  </Link>
                  {row.generationId ? (
                    <Link href={`/shopreel/generations/${row.generationId}`}>
                      <GlassButton variant="ghost">Open generation</GlassButton>
                    </Link>
                  ) : null}
                  {row.contentPieceId ? (
                    <Link href={`/shopreel/content/${row.contentPieceId}`}>
                      <GlassButton variant="ghost">Open content</GlassButton>
                    </Link>
                  ) : null}
                  {row.publishJob?.id ? (
                    <GlassButton
                      variant="ghost"
                      onClick={() => void runJob(row.publishJob!.id)}
                      disabled={runningJobId === row.publishJob.id || row.publishJob.status !== "queued"}
                    >
                      {runningJobId === row.publishJob.id ? "Running..." : "Run queued job"}
                    </GlassButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
