"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type OpportunityItem = {
  id: string;
  title: string;
  contentType: string;
  score: number | null;
  status: string;
  source: string;
  sourceType: "manual_upload" | "shop_data";
  createdAt: string;
};

type OpportunitiesResponse =
  | { ok: true; items: OpportunityItem[] }
  | { ok?: false; error?: string };

type GenerationResult = {
  ok: true;
  generated: {
    opportunityId: string;
    contentPieceId: string;
    renderJobId: string | null;
    generationId: string;
  };
};

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

export default function ShopReelOpportunitiesClient() {
  const router = useRouter();
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [generatedByOpportunity, setGeneratedByOpportunity] = useState<Record<string, string>>({});
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

      setItems(json.items ?? []);
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

      const discoverRes = await fetch("/api/shopreel/discovery", {
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
      setIsScoring(false);
    } finally {
      setIsScoring(false);
    }
  }, [loadItems]);

  const generateFromOpportunity = useCallback(
    async (opportunityId: string) => {
      try {
        setError(null);
        setIsGenerating(opportunityId);

        const res = await fetch(`/api/shopreel/opportunities/${opportunityId}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            createRenderJobNow: true,
          }),
        });

        const json = (await res.json()) as
  | GenerationResult
  | { ok?: boolean; error?: string };

if (!res.ok || !("generated" in json)) {
  throw new Error(("error" in json && json.error) || "Failed to generate story");
}

setGeneratedByOpportunity((prev) => ({
  ...prev,
  [opportunityId]: json.generated.generationId,
}));

        await loadItems(true);
        router.refresh();
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
    const highScoreCount = items.filter((item) => (item.score ?? 0) >= 85).length;
    const readyCount = items.filter((item) => item.status === "ready").length;

    return {
      total: items.length,
      manualCount,
      highScoreCount,
      readyCount,
    };
  }, [items]);

  return (
    <div className="space-y-5">
      <GlassCard
        label="Opportunities"
        title="Ranked story opportunities"
        description="Discovery feeds Story Sources, then the Opportunity Engine scores what should be generated first."
        strong
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">{summary.total} total</GlassBadge>
              <GlassBadge tone="copper">{summary.manualCount} manual</GlassBadge>
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
              const generationId = generatedByOpportunity[item.id] ?? null;

              return (
                <div
                  key={item.id}
                  className={cx(
                    "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                    (item.score ?? 0) >= 85
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
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <GlassBadge tone={item.sourceType === "manual_upload" ? "copper" : "default"}>
                      {formatLabel(item.sourceType)}
                    </GlassBadge>
                    <GlassBadge tone="default">{formatLabel(item.status)}</GlassBadge>
                    <GlassBadge tone={(item.score ?? 0) >= 85 ? "copper" : "muted"}>
                      Score {item.score != null ? Math.round(item.score) : "--"}
                    </GlassBadge>

                    {generationId ? (
                      <>
                        <Link href={`/shopreel/generations/${generationId}`}>
                          <GlassButton variant="ghost">Review</GlassButton>
                        </Link>
                        <Link href={`/shopreel/editor/${generationId}`}>
                          <GlassButton variant="secondary">Edit</GlassButton>
                        </Link>
                      </>
                    ) : null}

                    <GlassButton
                      variant="primary"
                      onClick={() => void generateFromOpportunity(item.id)}
                      disabled={isGenerating === item.id}
                    >
                      {isGenerating === item.id ? "Generating..." : "Generate"}
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
