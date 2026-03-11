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

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatContentType(contentType: string) {
  return contentType.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
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

      const json = (await res.json()) as
        | { ok: true; items: OpportunityItem[] }
        | { error?: string };

      if (!res.ok || !("ok" in json)) {
        throw new Error(("error" in json && json.error) || "Failed to load opportunities");
      }

      setItems(json.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const summary = useMemo(() => {
    const manualCount = items.filter((item) => item.sourceType === "manual_upload").length;
    const readyCount = items.filter((item) => item.status === "ready").length;
    const queuedCount = items.filter((item) => item.status === "queued").length;

    return {
      total: items.length,
      manualCount,
      readyCount,
      queuedCount,
    };
  }, [items]);

  return (
    <div className="space-y-5">
      <GlassCard
        label="Opportunity Queue"
        title="Ranked by content potential"
        description="Manual uploads and shop-generated concepts now flow into one opportunity queue."
        strong
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">{summary.total} total</GlassBadge>
              <GlassBadge tone="copper">{summary.manualCount} manual</GlassBadge>
              <GlassBadge tone="default">{summary.readyCount} ready</GlassBadge>
              <GlassBadge tone="muted">{summary.queuedCount} queued</GlassBadge>
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
            No opportunities yet. Upload content or generate from shop data to populate this queue.
          </div>
        ) : null}

        {!isLoading && !error ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                  item.sourceType === "manual_upload"
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
                    {item.source} • {formatContentType(item.contentType)} • {timeAgoLabel(item.createdAt)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <GlassBadge tone={item.sourceType === "manual_upload" ? "copper" : "default"}>
                    {item.source}
                  </GlassBadge>
                  <GlassBadge tone="default">{formatStatus(item.status)}</GlassBadge>
                  <GlassBadge tone="muted">
                    Score {item.score != null ? Math.round(item.score) : "--"}
                  </GlassBadge>
                  <Link href={`/shopreel/opportunities/${item.id}`}>
                    <GlassButton variant="secondary">Open</GlassButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
