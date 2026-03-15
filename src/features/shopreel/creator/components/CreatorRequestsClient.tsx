"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { getReviewPath } from "@/features/shopreel/lib/reviewPaths";
import type {
  BlogLengthMode,
  BlogStyle,
  OutputType,
} from "@/features/shopreel/creator/buildCreatorOutputs";

type Angle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

type CreatorRequestRow = {
  id: string;
  title: string | null;
  topic: string | null;
  audience: string | null;
  tone: string | null;
  platform_focus: "instagram" | "tiktok" | "youtube" | "facebook" | "multi" | null;
  mode: string;
  status: string;
  created_at: string;
  source_generation_id: string | null;
  result_payload: {
    expandedTopic?: string;
    summary?: string;
    bullets?: string[];
    angles?: Angle[];
    derivedPosts?: Array<{
      title: string;
      generationId: string;
      createdAt: string;
      angleTitle: string;
    }>;
  } | null;
};

type Props = {
  initialItems: CreatorRequestRow[];
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function timeAgoLabel(value: string | null) {
  if (!value) return "Unknown";

  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${diffMinutes || 1}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

export default function CreatorRequestsClient({ initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<CreatorRequestRow[]>(initialItems);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalAngles = useMemo(
    () =>
      items.reduce((sum, item) => {
        const count = Array.isArray(item.result_payload?.angles) ? item.result_payload?.angles.length ?? 0 : 0;
        return sum + count;
      }, 0),
    [items],
  );

  async function deleteRequest(requestId: string, label: string) {
    const confirmed = window.confirm(`Delete "${label}"?`);
    if (!confirmed) return;

    try {
      setError(null);
      setDeletingId(requestId);

      const res = await fetch(`/api/shopreel/creator-requests/${requestId}`, {
        method: "DELETE",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete creator request");
      }

      setItems((prev) => prev.filter((item) => item.id !== requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete creator request");
    } finally {
      setDeletingId(null);
    }
  }

  async function createFromAngle(
    requestId: string,
    angleIndex: number,
    outputType: OutputType = "video",
    blogStyle?: BlogStyle,
    blogLengthMode?: BlogLengthMode,
  ) {
    const key = `${requestId}:${angleIndex}:${outputType}`;
    try {
      setError(null);
      setRunningKey(key);

      const res = await fetch(`/api/shopreel/creator-requests/${requestId}/angles/${angleIndex}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outputType, blogStyle, blogLengthMode }),
      });

      const json = (await res.json()) as
        | {
            ok: true;
            generated: {
              generationId: string;
              editorUrl?: string;
            };
          }
        | {
            ok?: false;
            error?: string;
          };

      if (!res.ok || !("generated" in json)) {
        throw new Error(("error" in json && json.error) || "Failed to create from angle");
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== requestId) return item;

          const angles = Array.isArray(item.result_payload?.angles) ? item.result_payload.angles : [];
          const angle = angles[angleIndex];

          return {
            ...item,
            result_payload: {
              ...(item.result_payload ?? {}),
              derivedPosts: [
                ...((item.result_payload?.derivedPosts ?? []) as Array<{
                  title: string;
                  generationId: string;
                  createdAt: string;
                  angleTitle: string;
                }>),
                {
                  title: `${item.topic ?? item.title ?? "Creator request"} — ${angle?.title ?? `Angle ${angleIndex + 1}`}`,
                  generationId: json.generated.generationId,
                  createdAt: new Date().toISOString(),
                  angleTitle: angle?.title ?? `Angle ${angleIndex + 1}`,
                },
              ],
            },
          };
        }),
      );

      router.push(getReviewPath(outputType, json.generated.generationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create from angle");
    } finally {
      setRunningKey(null);
    }
  }

  return (
    <div className="space-y-5">
      <GlassCard
        label="Creator memory"
        title="Saved prompt requests"
        description="Every creator prompt can become a reusable request, a future opportunity, or a blog seed."
        strong
        footer={
          <div className="flex flex-wrap gap-2">
            <GlassBadge tone="default">{items.length} requests</GlassBadge>
            <GlassBadge tone="copper">{totalAngles} angles</GlassBadge>
          </div>
        }
      >
        {error ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.copper,
              glassTheme.glass.panelSoft,
              glassTheme.text.copperSoft,
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
              glassTheme.text.secondary,
            )}
          >
            No creator requests yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const angles = Array.isArray(item.result_payload?.angles) ? item.result_payload?.angles : [];
              const derivedPosts = Array.isArray(item.result_payload?.derivedPosts)
                ? item.result_payload?.derivedPosts
                : [];

              return (
                <div
                  key={item.id}
                  className={cx(
                    "rounded-3xl border p-5",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className={cx("text-2xl font-semibold", glassTheme.text.primary)}>
                        {item.title ?? item.topic ?? "Untitled request"}
                      </div>

                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {formatLabel(item.mode)} • {formatLabel(item.status)} • {timeAgoLabel(item.created_at)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone="default">{formatLabel(item.mode)}</GlassBadge>
                      <GlassBadge tone={item.status === "ready" ? "copper" : "muted"}>
                        {formatLabel(item.status)}
                      </GlassBadge>
                      <GlassBadge tone="default">{angles.length} angles</GlassBadge>
                      <GlassBadge tone="muted">{derivedPosts.length} derived posts</GlassBadge>
                    </div>
                  </div>

                  {item.topic ? (
                    <div className={cx("mt-4 text-lg", glassTheme.text.primary)}>
                      {item.topic}
                    </div>
                  ) : null}

                  {item.result_payload?.summary ? (
                    <div className={cx("mt-4 text-sm leading-7", glassTheme.text.secondary)}>
                      {item.result_payload.summary}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    {item.source_generation_id ? (
                      <>
                        <Link href={getReviewPath("video", item.source_generation_id)}>
                          <GlassButton variant="ghost">Review</GlassButton>
                        </Link>
                        <Link href={getEditorPath("video", item.source_generation_id)}>
                          <GlassButton variant="secondary">Open editor</GlassButton>
                        </Link>
                      </>
                    ) : null}

                    <GlassButton
                      variant="ghost"
                      onClick={() =>
                        void deleteRequest(item.id, item.title ?? item.topic ?? "Creator request")
                      }
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? "Deleting..." : "Delete"}
                    </GlassButton>
                  </div>

                  {angles.length > 0 ? (
                    <div className="mt-6 grid gap-4">
                      {angles.map((angle, index) => {
                        const busyVideo = runningKey === `${item.id}:${index}:video`;
                        const busyBlog = runningKey === `${item.id}:${index}:blog`;
                        const busyVlog = runningKey === `${item.id}:${index}:vlog`;

                        return (
                          <div
                            key={`${item.id}:${angle.title}:${index}`}
                            className={cx(
                              "rounded-2xl border p-5",
                              glassTheme.border.copper,
                              glassTheme.glass.panel,
                            )}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className={cx("text-xl font-semibold", glassTheme.text.primary)}>
                                  {angle.title}
                                </div>
                                <div className={cx("text-sm", glassTheme.text.secondary)}>
                                  {angle.angle}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <GlassButton
                                  variant="primary"
                                  onClick={() => void createFromAngle(item.id, index, "video")}
                                  disabled={busyVideo}
                                >
                                  {busyVideo ? "Creating..." : "Video"}
                                </GlassButton>
                                <GlassButton
                                  variant="secondary"
                                  onClick={() =>
                                    void createFromAngle(item.id, index, "vlog")
                                  }
                                  disabled={busyVlog}
                                >
                                  {busyVlog ? "Creating..." : "Vlog"}
                                </GlassButton>
                                <GlassButton
                                  variant="secondary"
                                  onClick={() =>
                                    void createFromAngle(
                                      item.id,
                                      index,
                                      "blog",
                                      "auto",
                                      "standard",
                                    )
                                  }
                                  disabled={busyBlog}
                                >
                                  {busyBlog ? "Creating..." : "Blog"}
                                </GlassButton>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                              <div className={glassTheme.text.primary}>
                                <span className={glassTheme.text.secondary}>Hook:</span> {angle.hook}
                              </div>
                              <div className={glassTheme.text.secondary}>
                                <span className="text-white/85">Why it works:</span> {angle.whyItWorks}
                              </div>
                              <div className={glassTheme.text.secondary}>
                                <span className="text-white/85">CTA:</span> {angle.suggestedCta}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {derivedPosts.length > 0 ? (
                    <div className="mt-6 grid gap-3">
                      {derivedPosts.map((post) => (
                        <div
                          key={`${item.id}:${post.generationId}`}
                          className={cx(
                            "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                            glassTheme.border.softer,
                            glassTheme.glass.panelSoft,
                          )}
                        >
                          <div className="space-y-1">
                            <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                              {post.title}
                            </div>
                            <div className={cx("text-sm", glassTheme.text.secondary)}>
                              {post.angleTitle} • {timeAgoLabel(post.createdAt)}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 md:justify-end">
                            <Link href={getReviewPath("video", post.generationId)}>
                              <GlassButton variant="ghost">Review</GlassButton>
                            </Link>
                            <Link href={getEditorPath("video", post.generationId)}>
                              <GlassButton variant="secondary">Edit</GlassButton>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
