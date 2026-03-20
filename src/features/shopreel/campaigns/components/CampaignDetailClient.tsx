"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { formatShopReelStatus } from "@/features/shopreel/lib/uiLabels";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type CampaignRow = {
  id: string;
  title: string;
  core_idea: string;
  audience: string | null;
  offer: string | null;
  campaign_goal: string | null;
  status: string;
  platform_focus: string[];
  created_at: string;
};

type CampaignItemRow = {
  id: string;
  title: string;
  angle: string;
  prompt: string;
  status: string;
  aspect_ratio: string;
  style: string | null;
  visual_mode: string | null;
  media_job_id: string | null;
  final_output_asset_id?: string | null;
};

type CampaignAnalyticsRow = {
  total_views: number;
  total_engagement: number;
  winning_angle: string | null;
} | null;

type CampaignLearningRow = {
  id: string;
  learning_key: string;
  learning_type: string;
  confidence: number | null;
};

export default function CampaignDetailClient({
  campaign,
  items,
  analytics,
  learnings,
  progress,
}: {
  campaign: CampaignRow;
  items: CampaignItemRow[];
  analytics: CampaignAnalyticsRow;
  learnings: CampaignLearningRow[];
  progress: {
    totalItems: number;
    completedItems: number;
    progressPercent: number;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteCampaign() {
    const confirmed = window.confirm(
      "Delete this campaign and all related items, scenes, and jobs?"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/delete`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      window.alert(json?.error ?? "Failed to delete campaign");
      return;
    }

    router.push("/shopreel/campaigns");
    router.refresh();
  }

  async function runAction(key: string, url: string) {
    try {
      setBusy(key);
      setError(null);
      const res = await fetch(url, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? `Failed action: ${key}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Production"
        title="Campaign workspace"
        description="Run the campaign pipeline from scene generation through final assembly."
        strong
      >
        <div className="flex flex-wrap items-center gap-3">
          <GlassButton
            variant="secondary"
            onClick={() =>
              void runAction("generate", `/api/shopreel/campaigns/${campaign.id}/generate`)
            }
            disabled={busy === "generate"}
          >
            {busy === "generate" ? "Working..." : "Generate Scenes"}
          </GlassButton>

          <GlassButton
            variant="secondary"
            onClick={() =>
              void runAction("run-jobs", `/api/shopreel/campaigns/${campaign.id}/run-all-jobs`)
            }
            disabled={busy === "run-jobs"}
          >
            {busy === "run-jobs" ? "Working..." : "Run Scene Jobs"}
          </GlassButton>

          <GlassButton
            variant="primary"
            onClick={() =>
              void runAction("sync", `/api/shopreel/campaigns/${campaign.id}/sync-processing`)
            }
            disabled={busy === "sync"}
          >
            {busy === "sync" ? "Working..." : "Sync + Assemble"}
          </GlassButton>

          <Link href={`/shopreel/publish-center?campaign=${campaign.id}`}>
            <GlassButton variant="ghost">4. Publish</GlassButton>
          </Link>

          <Link href="/shopreel/campaigns/new">
            <GlassButton variant="ghost">New Brief</GlassButton>
          </Link>

          <GlassButton variant="ghost" onClick={handleDeleteCampaign}>
            Delete Campaign
          </GlassButton>
        </div>

        {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
      </GlassCard>

      <GlassCard
        label="Progress"
        title="Campaign Progress"
        description="Track how many final ads are complete."
        strong
      >
        <div className="space-y-4">
          <div className="text-3xl font-semibold text-white">
            {progress.progressPercent}%
          </div>
          <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300/80 via-blue-400/80 to-emerald-300/80 transition-all"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <div className="text-sm text-white/70">
            {progress.completedItems} / {progress.totalItems} final videos completed
          </div>
        </div>
      </GlassCard>

      <GlassCard
        label="Campaign"
        title={campaign.title}
        description={campaign.core_idea}
        strong
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <GlassBadge tone="default">
              {formatShopReelStatus(campaign.status)}
            </GlassBadge>
            {campaign.platform_focus.map((platform) => (
              <GlassBadge key={platform} tone="muted">
                {platform}
              </GlassBadge>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                Audience
              </div>
              <div className="mt-2 text-sm text-white">
                {campaign.audience ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                Offer
              </div>
              <div className="mt-2 text-sm text-white">
                {campaign.offer ?? "—"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                Goal
              </div>
              <div className="mt-2 text-sm text-white">
                {campaign.campaign_goal ?? "—"}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard
        label="Items"
        title="Campaign Items"
        description="Each item becomes a multi-scene final ad."
        strong
      >
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-white">
                    {item.title}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <GlassBadge tone="default">
                      {formatShopReelStatus(item.status)}
                    </GlassBadge>
                    <GlassBadge tone="muted">{item.angle}</GlassBadge>
                    <GlassBadge tone="muted">{item.aspect_ratio}</GlassBadge>
                    {item.style ? (
                      <GlassBadge tone="muted">{item.style}</GlassBadge>
                    ) : null}
                    {item.visual_mode ? (
                      <GlassBadge tone="muted">{item.visual_mode}</GlassBadge>
                    ) : null}
                    {item.final_output_asset_id ? (
                      <GlassBadge tone="copper">Final ad ready</GlassBadge>
                    ) : null}
                  </div>

                  <div className="text-sm text-white/70">{item.prompt}</div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link href={`/shopreel/campaigns/items/${item.id}`}>
                    <GlassButton variant="ghost">Open Item</GlassButton>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {analytics ? (
        <GlassCard
          label="Analytics"
          title="Campaign Results"
          description="Performance rolled up across outputs."
          strong
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm text-white/55">Views</div>
              <div className="mt-1 text-2xl font-semibold text-white">
                {analytics.total_views}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm text-white/55">Engagement</div>
              <div className="mt-1 text-2xl font-semibold text-white">
                {analytics.total_engagement}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm text-white/55">Winning angle</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {analytics.winning_angle ?? "—"}
              </div>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {learnings.length > 0 ? (
        <GlassCard
          label="Learnings"
          title="Extracted Learnings"
          description="What the system learned from this campaign."
          strong
        >
          <div className="grid gap-3">
            {learnings.map((learning) => (
              <div
                key={learning.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="text-sm font-medium text-white">
                  {learning.learning_key}
                </div>
                <div className="text-sm text-white/70">
                  {learning.learning_type}
                </div>
                <div className="text-xs text-white/50">
                  Confidence: {learning.confidence ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
