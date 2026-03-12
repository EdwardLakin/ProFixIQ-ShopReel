"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

type StorySourceItem = {
  id: string;
  title: string;
  kind: string;
  origin: string;
  generation_mode: string;
  created_at: string;
  tags: string[] | null;
};

type StorySourceResponse =
  | {
      ok: true;
      mode: string;
      count: number;
      sources?: StorySourceItem[];
      candidates?: Array<{
        title: string;
        kind: string;
        confidence: number;
        reason: string;
        tags: string[];
      }>;
    }
  | { ok?: false; error?: string };

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
  const [items, setItems] = useState<StorySourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (refresh = false) => {
    try {
      setError(null);
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetch("/api/shopreel/story-sources?mode=saved&limit=50", {
        method: "GET",
        cache: "no-store",
      });

      const json = (await res.json()) as StorySourceResponse;

      if (!res.ok || !json.ok) {
        throw new Error(("error" in json && json.error) || "Failed to load story sources");
      }

      setItems(json.sources ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load story sources");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const discoverNow = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      const res = await fetch("/api/shopreel/story-pipeline/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 3,
          createRenderJobNow: false,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to discover story sources");
      }

      await loadItems(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discover story sources");
      setIsRefreshing(false);
    }
  }, [loadItems]);

  const generateFromSavedSource = useCallback(
    async (storySourceId: string) => {
      try {
        setError(null);
        setIsGenerating(storySourceId);

        const res = await fetch("/api/shopreel/story-sources/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storySourceId,
            createRenderJobNow: true,
          }),
        });

        const json = (await res.json()) as { ok?: boolean; error?: string };

        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Failed to generate story");
        }

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate story");
      } finally {
        setIsGenerating(null);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const summary = useMemo(() => {
    const manualCount = items.filter((item) => item.origin === "manual_upload").length;
    const projectCount = items.filter((item) => item.origin === "project").length;
    const assistedCount = items.filter((item) => item.generation_mode === "assisted").length;

    return {
      total: items.length,
      manualCount,
      projectCount,
      assistedCount,
    };
  }, [items]);

  return (
    <div className="space-y-5">
      <GlassCard
        label="Story Sources"
        title="Ranked business story opportunities"
        description="Story Sources are now the primary queue. Discovery finds what happened, then generation turns it into content."
        strong
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">{summary.total} total</GlassBadge>
              <GlassBadge tone="copper">{summary.manualCount} manual</GlassBadge>
              <GlassBadge tone="default">{summary.projectCount} project</GlassBadge>
              <GlassBadge tone="muted">{summary.assistedCount} assisted</GlassBadge>
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
                onClick={() => void discoverNow()}
                disabled={isRefreshing}
              >
                {isRefreshing ? "Discovering..." : "Discover stories"}
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
            Loading story sources...
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
            No story sources yet. Click Discover stories to generate the first saved queue entries.
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                  item.origin === "manual_upload"
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
                    {formatLabel(item.kind)} • {formatLabel(item.origin)} •{" "}
                    {timeAgoLabel(item.created_at)}
                  </div>
                  {item.tags && item.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.tags.slice(0, 4).map((tag) => (
                        <GlassBadge key={tag} tone="muted">
                          {tag}
                        </GlassBadge>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <GlassBadge tone={item.origin === "manual_upload" ? "copper" : "default"}>
                    {formatLabel(item.origin)}
                  </GlassBadge>
                  <GlassBadge tone="default">{formatLabel(item.generation_mode)}</GlassBadge>
                  <GlassButton
                    variant="secondary"
                    onClick={() => void generateFromSavedSource(item.id)}
                    disabled={isGenerating === item.id}
                  >
                    {isGenerating === item.id ? "Generating..." : "Generate"}
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
