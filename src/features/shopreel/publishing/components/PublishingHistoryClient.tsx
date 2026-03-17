"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

export type PublicationRow = {
  id: string;
  platform: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string;
  platform_post_url: string | null;
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

export default function PublishingHistoryClient({
  initialPublications,
}: {
  initialPublications: PublicationRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<PublicationRow[]>(initialPublications);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [queueingId, setQueueingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const total = useMemo(() => items.length, [items]);

  async function deletePublication(item: PublicationRow) {
    const confirmed = window.confirm(
      `Delete this ${item.platform ?? "publication"} history record?`
    );
    if (!confirmed) return;

    try {
      setError(null);
      setMessage(null);
      setDeletingId(item.id);

      const res = await fetch(`/api/shopreel/publications/${item.id}`, {
        method: "DELETE",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete publication");
      }

      setItems((current) => current.filter((candidate) => candidate.id !== item.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete publication");
    } finally {
      setDeletingId(null);
    }
  }

  async function enqueuePublication(item: PublicationRow) {
    try {
      setError(null);
      setMessage(null);
      setQueueingId(item.id);

      const res = await fetch(`/api/shopreel/publications/${item.id}/enqueue`, {
        method: "POST",
      });

      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        alreadyQueued?: boolean;
      };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to queue publication");
      }

      setMessage(
        json.alreadyQueued ? "Publish job already exists." : "Publish job queued."
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue publication");
    } finally {
      setQueueingId(null);
    }
  }

  return (
    <GlassCard
      label="History"
      title="Recent outcomes"
      description="A record of what has already been sent through the publishing engine."
      strong
      footer={
        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{total} items</GlassBadge>
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

      {items.length === 0 ? (
        <div
          className={cx(
            "rounded-2xl border p-4 text-sm",
            glassTheme.border.softer,
            glassTheme.glass.panelSoft,
            glassTheme.text.secondary
          )}
        >
          No publishing history yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const canQueue = item.status === "queued" || item.status === "failed";

            return (
              <div
                key={item.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="space-y-1">
                  <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                    {(item.metadata as any)?.title ?? item.platform ?? "Publication"}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {item.platform ?? "platform"} • {timeAgoLabel(item.published_at ?? item.created_at)}
                  </div>
                  {item.platform_post_url ? (
                    <a
                      href={item.platform_post_url}
                      target="_blank"
                      rel="noreferrer"
                      className={cx("text-sm underline", glassTheme.text.copperSoft)}
                    >
                      Open live post
                    </a>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <GlassBadge tone={item.status === "published" ? "copper" : "default"}>
                    {item.status ?? "unknown"}
                  </GlassBadge>

                  {canQueue ? (
                    <GlassButton
                      variant="secondary"
                      onClick={() => void enqueuePublication(item)}
                      disabled={queueingId === item.id}
                    >
                      {queueingId === item.id
                        ? "Queueing..."
                        : item.status === "failed"
                          ? "Retry"
                          : "Queue Job"}
                    </GlassButton>
                  ) : null}

                  <GlassButton
                    variant="ghost"
                    onClick={() => void deletePublication(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </GlassButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
