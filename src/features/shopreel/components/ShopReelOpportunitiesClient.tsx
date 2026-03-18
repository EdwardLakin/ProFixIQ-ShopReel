"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

type Opportunity = {
  id: string;
  score: number;
  status: string;
  reason: string | null;
  metadata: unknown;
  story_source_id: string;
  story_source?: {
    id: string;
    title: string;
    description: string | null;
    kind: string;
    origin: string;
  } | null;
};

export default function ShopReelOpportunitiesClient({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runDiscovery() {
    try {
      setBusy("discovery");
      setError(null);
      const res = await fetch("/api/shopreel/discovery", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to run discovery");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run discovery");
    } finally {
      setBusy(null);
    }
  }

  async function dismissOpportunity(id: string) {
    try {
      setBusy(id);
      setError(null);
      const res = await fetch(`/api/shopreel/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to dismiss opportunity");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dismiss opportunity");
    } finally {
      setBusy(null);
    }
  }

  async function generateOpportunity(id: string) {
    try {
      setBusy(id);
      setError(null);
      const res = await fetch(`/api/shopreel/opportunities/${id}/generate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to generate opportunity");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate opportunity");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <GlassButton
          variant="primary"
          onClick={() => void runDiscovery()}
          disabled={busy === "discovery"}
        >
          {busy === "discovery" ? "Working..." : "Discover + score"}
        </GlassButton>
      </div>

      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      {opportunities.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
          No opportunities yet. Click Discover + score to build the ranked queue.
        </div>
      ) : (
        opportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="text-lg font-semibold text-white">
                  {opportunity.story_source?.title ?? "Untitled opportunity"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <GlassBadge tone="default">{opportunity.status}</GlassBadge>
                  <GlassBadge tone="copper">Score {Math.round(Number(opportunity.score ?? 0))}</GlassBadge>
                  {opportunity.story_source?.kind ? (
                    <GlassBadge tone="muted">{opportunity.story_source.kind}</GlassBadge>
                  ) : null}
                </div>
                {opportunity.reason ? (
                  <div className="text-sm text-white/70">{opportunity.reason}</div>
                ) : null}
                {opportunity.story_source?.description ? (
                  <div className="text-sm text-white/60">
                    {opportunity.story_source.description}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <GlassButton
                  variant="secondary"
                  onClick={() => void generateOpportunity(opportunity.id)}
                  disabled={busy === opportunity.id}
                >
                  {busy === opportunity.id ? "Working..." : "Generate"}
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  onClick={() => void dismissOpportunity(opportunity.id)}
                  disabled={busy === opportunity.id}
                >
                  Dismiss
                </GlassButton>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
