"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { getReviewPath } from "@/features/shopreel/lib/reviewPaths";

type OpportunityItem = {
  id: string;
  kind: "story_opportunity" | "creator_request";
  title: string;
  contentType: string;
  score: number | null;
  status: string;
  source: string;
  sourceType: "manual_upload" | "shop_data" | "creator_prompt";
  createdAt: string;
  generationId: string | null;
  creatorMode: string | null;
  summary: string | null;
};

type OpportunitiesResponse =
  | { ok: true; items: OpportunityItem[] }
  | { ok?: false; error?: string };

type GenerationResult =
  | {
      ok: true;
      generated: {
        opportunityId?: string;
        creatorRequestId?: string;
        contentPieceId?: string;
        renderJobId?: string | null;
        generationId: string;
        editorUrl?: string;
      };
    }
  | { ok?: boolean; error?: string };

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

function itemKeyFor(item: Pick<OpportunityItem, "kind" | "id">) {
  return `${item.kind}:${item.id}`;
}

function dedupeItems(items: OpportunityItem[]): OpportunityItem[] {
  const seen = new Set<string>();
  const result: OpportunityItem[] = [];

  for (const item of items) {
    const key = itemKeyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function editorPathFromItem(item: OpportunityItem, generationId: string) {
  return getEditorPath(item.contentType.toLowerCase(), generationId);
}

export default function ShopReelOpportunitiesClient() {
  const router = useRouter();
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [generatedByItem, setGeneratedByItem] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (refresh = false) => {
    try {
      setError(null);
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetch("/api/shopreel/opportunities?limit=50", {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as OpportunitiesResponse;

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to load opportunities");
      }

      setItems(dedupeItems(json.items ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const discoverAndScore = useCallback(async () => {
    try {
      setError(null);
      setIsScoring(true);

      const discoverRes = await fetch("/api/shopreel/discover", {
        method: "POST",
      });

      const discoverJson = (await discoverRes.json()) as { ok?: boolean; error?: string };

      if (!discoverRes.ok || !discoverJson.ok) {
        throw new Error(discoverJson.error ?? "Failed discovery");
      }

      const scoreRes = await fetch("/api/shopreel/opportunities/generate", {
        method: "POST",
      });

      const scoreJson = (await scoreRes.json()) as { ok?: boolean; error?: string };

      if (!scoreRes.ok || !scoreJson.ok) {
        throw new Error(scoreJson.error ?? "Failed opportunity scoring");
      }

      await loadItems(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh opportunities");
    } finally {
      setIsScoring(false);
    }
  }, [loadItems]);

  const deleteItem = useCallback(
    async (item: OpportunityItem) => {
      const itemKey = itemKeyFor(item);
      const confirmed = window.confirm(`Delete "${item.title}" from opportunities?`);
      if (!confirmed) return;

      try {
        setError(null);
        setIsDeleting(itemKey);

        const endpoint =
          item.kind === "creator_request"
            ? `/api/shopreel/creator-requests/${item.id}`
            : `/api/shopreel/opportunities/${item.id}`;

        const res = await fetch(endpoint, {
          method: "DELETE",
        });

        const json = (await res.json()) as { ok?: boolean; error?: string };

        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Failed to delete item");
        }

        setItems((current) => current.filter((candidate) => itemKeyFor(candidate) !== itemKey));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete item");
      } finally {
        setIsDeleting(null);
      }
    },
    [],
  );

  const generateFromItem = useCallback(
    async (item: OpportunityItem) => {
      const itemKey = itemKeyFor(item);

      try {
        setError(null);
        setIsGenerating(itemKey);

        if (item.generationId) {
          router.push(editorPathFromItem(item, item.generationId));
          return;
        }

        const endpoint =
          item.kind === "creator_request"
            ? `/api/shopreel/creator-requests/${item.id}/generate`
            : `/api/shopreel/opportunities/${item.id}/generate`;

        const body =
          item.kind === "creator_request"
            ? undefined
            : JSON.stringify({
                createRenderJobNow: true,
              });

        const res = await fetch(endpoint, {
          method: "POST",
          headers:
            item.kind === "creator_request"
              ? undefined
              : {
                  "Content-Type": "application/json",
                },
          body,
        });

        const json = (await res.json()) as GenerationResult;

        if (!res.ok || !("generated" in json)) {
          throw new Error(("error" in json && json.error) || "Failed to generate story");
        }

        setGeneratedByItem((prev) => ({
          ...prev,
          [itemKey]: json.generated.generationId,
        }));

        await loadItems(true);
        router.push(json.generated.editorUrl ?? editorPathFromItem(item, json.generated.generationId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate story");
      } finally {
        setIsGenerating(null);
      }
    },
    [loadItems, router],
  );

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const summary = useMemo(() => {
    const manualCount = items.filter((item) => item.sourceType === "manual_upload").length;
    const creatorCount = items.filter((item) => item.sourceType === "creator_prompt").length;
    const highScoreCount = items.filter((item) => (item.score ?? 0) >= 85).length;
    const readyCount = items.filter((item) => item.status === "ready").length;

    return {
      total: items.length,
      manualCount,
      creatorCount,
      highScoreCount,
      readyCount,
    };
  }, [items]);

  return (
    <div className="space-y-5">
      <GlassCard
        label="Opportunities"
        title="Ranked story opportunities"
        description="Business story opportunities and saved creator prompts now live in one queue."
        strong
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">{summary.total} total</GlassBadge>
              <GlassBadge tone="copper">{summary.manualCount} manual</GlassBadge>
              <GlassBadge tone="default">{summary.creatorCount} creator prompts</GlassBadge>
              <GlassBadge tone="default">{summary.highScoreCount} high score</GlassBadge>
              <GlassBadge tone="muted">{summary.readyCount} ready</GlassBadge>
            </div>

            <div className="flex flex-wrap gap-3">
              <GlassButton variant="ghost" onClick={() => router.refresh()}>
                Refresh layout
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={() => void loadItems(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh queue"}
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={() => void discoverAndScore()}
                disabled={isScoring}
              >
                {isScoring ? "Running..." : "Discover + score"}
              </GlassButton>
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary,
            )}
          >
            Loading opportunities...
          </div>
        ) : null}

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

        {!isLoading && !error && items.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary,
            )}
          >
            No opportunities yet. Click Discover + score to build the ranked queue.
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="grid gap-3">
            {items.map((item) => {
              const itemKey = itemKeyFor(item);
              const generationId = generatedByItem[itemKey] ?? item.generationId ?? null;
              const busyDelete = isDeleting === itemKey;

              return (
                <div
                  key={itemKey}
                  className={cx(
                    "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                    item.sourceType === "creator_prompt" || (item.score ?? 0) >= 85
                      ? glassTheme.border.copper
                      : glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {item.title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {formatLabel(item.contentType)} • {formatLabel(item.source)} •{" "}
                      {timeAgoLabel(item.createdAt)}
                    </div>

                    {item.summary ? (
                      <div className={cx("pt-1 text-sm", glassTheme.text.secondary)}>
                        {item.summary}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <GlassBadge tone={item.sourceType === "creator_prompt" ? "copper" : "default"}>
                      {formatLabel(item.sourceType)}
                    </GlassBadge>
                    <GlassBadge tone="default">{formatLabel(item.status)}</GlassBadge>

                    {item.sourceType !== "creator_prompt" ? (
                      <GlassBadge tone={(item.score ?? 0) >= 85 ? "copper" : "muted"}>
                        Score {item.score != null ? Math.round(item.score) : "--"}
                      </GlassBadge>
                    ) : (
                      <GlassBadge tone="muted">
                        {formatLabel(item.creatorMode ?? "creator_request")}
                      </GlassBadge>
                    )}

                    {generationId ? (
                      <>
                        <Link href={getReviewPath(item.contentType.toLowerCase(), generationId)}>
                          <GlassButton variant="ghost">Review</GlassButton>
                        </Link>
                        <Link href={editorPathFromItem(item, generationId)}>
                          <GlassButton variant="secondary">Edit</GlassButton>
                        </Link>
                      </>
                    ) : null}

                    <GlassButton
                      variant="ghost"
                      onClick={() => void deleteItem(item)}
                      disabled={busyDelete}
                    >
                      {busyDelete ? "Deleting..." : "Delete"}
                    </GlassButton>

                    <GlassButton
                      variant="primary"
                      onClick={() => void generateFromItem(item)}
                      disabled={isGenerating === itemKey}
                    >
                      {isGenerating === itemKey
                        ? "Generating..."
                        : item.sourceType === "creator_prompt"
                          ? "Reuse"
                          : "Generate"}
                    </GlassButton>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
