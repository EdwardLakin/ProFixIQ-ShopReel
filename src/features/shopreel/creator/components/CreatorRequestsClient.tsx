"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

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

export default function CreatorRequestsClient(props: { initialItems: CreatorRequestRow[] }) {
  const router = useRouter();
  const [creatingAngleKey, setCreatingAngleKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createFromAngle(item: CreatorRequestRow, angle: Angle, index: number) {
    try {
      const key = `${item.id}:${index}`;
      setCreatingAngleKey(key);
      setError(null);

      const res = await fetch("/api/shopreel/create/from-angle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorRequestId: item.id,
          topic: item.topic ?? item.title ?? "Creator request",
          audience: item.audience ?? null,
          platformFocus: item.platform_focus ?? "multi",
          tone: item.tone ?? "confident",
          expandedTopic:
            item.result_payload?.expandedTopic ??
            item.topic ??
            item.title ??
            "Creator request",
          researchSummary: item.result_payload?.summary ?? null,
          researchBullets: item.result_payload?.bullets ?? [],
          angle,
        }),
      });

      const json = (await res.json()) as
        | { ok: true; editorUrl: string }
        | { ok?: false; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to create from angle");
      }

      router.push(json.editorUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create from angle");
    } finally {
      setCreatingAngleKey(null);
    }
  }

  return (
    <GlassCard
      label="Creator memory"
      title="Saved prompt requests"
      description="Every creator prompt can become a reusable request, a future opportunity, or a blog seed."
      strong
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

      {props.initialItems.length === 0 ? (
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
        <div className="grid gap-3">
          {props.initialItems.map((item) => {
            const resultPayload =
              item.result_payload && typeof item.result_payload === "object"
                ? item.result_payload
                : {};

            const angles = Array.isArray(resultPayload.angles) ? resultPayload.angles : [];
            const derivedPosts = Array.isArray(resultPayload.derivedPosts)
              ? resultPayload.derivedPosts
              : [];

            return (
              <div
                key={item.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {item.title ?? item.topic ?? "Creator request"}
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
                    {angles.length > 0 ? (
                      <GlassBadge tone="default">{angles.length} angles</GlassBadge>
                    ) : null}
                    {derivedPosts.length > 0 ? (
                      <GlassBadge tone="copper">{derivedPosts.length} derived posts</GlassBadge>
                    ) : null}
                  </div>
                </div>

                {item.topic ? (
                  <div className={cx("mt-3 text-sm", glassTheme.text.primary)}>
                    {item.topic}
                  </div>
                ) : null}

                {typeof resultPayload.summary === "string" && resultPayload.summary ? (
                  <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                    {resultPayload.summary}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  {item.source_generation_id ? (
                    <>
                      <Link href={`/shopreel/generations/${item.source_generation_id}`}>
                        <GlassButton variant="ghost">Review</GlassButton>
                      </Link>
                      <Link href={`/shopreel/editor/${item.source_generation_id}`}>
                        <GlassButton variant="secondary">Open editor</GlassButton>
                      </Link>
                    </>
                  ) : null}
                </div>

                {angles.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {angles.map((angle, index) => {
                      const key = `${item.id}:${index}`;

                      return (
                        <div
                          key={key}
                          className={cx(
                            "rounded-2xl border p-4",
                            glassTheme.border.copper,
                            glassTheme.glass.panelSoft,
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-2">
                              <div className={cx("text-base font-semibold", glassTheme.text.primary)}>
                                {angle.title}
                              </div>
                              <div className={cx("text-sm", glassTheme.text.secondary)}>
                                {angle.angle}
                              </div>
                            </div>

                            <GlassButton
                              variant="primary"
                              onClick={() => void createFromAngle(item, angle, index)}
                              disabled={creatingAngleKey === key}
                            >
                              {creatingAngleKey === key ? "Creating..." : "Create post from angle"}
                            </GlassButton>
                          </div>

                          <div className={cx("mt-3 text-sm", glassTheme.text.primary)}>
                            Hook: {angle.hook}
                          </div>
                          <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                            Why it works: {angle.whyItWorks}
                          </div>
                          <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                            CTA: {angle.suggestedCta}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {derivedPosts.length > 0 ? (
                  <div className="mt-4 grid gap-2">
                    {derivedPosts.map((post) => (
                      <div
                        key={post.generationId}
                        className={cx(
                          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3",
                          glassTheme.border.softer,
                          glassTheme.glass.panelSoft,
                        )}
                      >
                        <div>
                          <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                            {post.title}
                          </div>
                          <div className={cx("text-xs", glassTheme.text.secondary)}>
                            {post.angleTitle} • {timeAgoLabel(post.createdAt)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/shopreel/generations/${post.generationId}`}>
                            <GlassButton variant="ghost">Review</GlassButton>
                          </Link>
                          <Link href={`/shopreel/editor/${post.generationId}`}>
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
  );
}
