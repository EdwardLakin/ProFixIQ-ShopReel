"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import { formatShopReelStatus } from "@/features/shopreel/lib/uiLabels";

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

function getNextAction(progress: {
  totalItems: number;
  completedItems: number;
  totalScenes: number;
  linkedScenes: number;
  queuedScenes: number;
  processingScenes: number;
  completedScenes: number;
  failedScenes: number;
}) {
  if (progress.totalItems > 0 && progress.completedItems === progress.totalItems) {
    return {
      action: "publish" as const,
      label: "Publish campaign",
      description: "Your final videos are ready to review and publish.",
    };
  }

  if (
    progress.processingScenes > 0 ||
    progress.queuedScenes > 0 ||
    progress.completedScenes > 0 ||
    progress.failedScenes > 0
  ) {
    return {
      action: "check_progress" as const,
      label: "Check progress",
      description:
        "Your scene videos have started. Refresh progress and assemble anything ready.",
    };
  }

  if (progress.totalScenes > 0 || progress.linkedScenes > 0) {
    return {
      action: "create_videos" as const,
      label: "Create videos",
      description: "Your scenes are ready. Start generating the campaign videos.",
    };
  }

  return {
    action: "build_scenes" as const,
    label: "Build scenes",
    description: "Create the scene plan for each video in this campaign.",
  };
}

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
    totalScenes: number;
    linkedScenes: number;
    queuedScenes: number;
    processingScenes: number;
    completedScenes: number;
    failedScenes: number;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const nextAction = useMemo(() => getNextAction(progress), [progress]);

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

  async function runAction(key: string, url: string, message: string) {
    try {
      setBusy(key);
      setError(null);
      setStatusMessage(message);

      const res = await fetch(url, { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? `Failed action: ${key}`);
      }

      router.refresh();
      window.setTimeout(() => {
        setStatusMessage(null);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const anyBusy = busy !== null;

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Production"
        title="Campaign workspace"
        description="Follow the next step to move this campaign from scenes to final videos."
        strong
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-white/55">
            Next step
          </div>

          <div className="mt-2 text-lg font-semibold text-white">
            {nextAction.label}
          </div>

          <div className="mt-1 text-sm text-white/70">
            {nextAction.description}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/60">
            <span>{progress.totalScenes} scenes</span>
            <span>•</span>
            <span>{progress.queuedScenes} queued</span>
            <span>•</span>
            <span>{progress.processingScenes} processing</span>
            <span>•</span>
            <span>{progress.completedScenes} completed</span>
            {progress.failedScenes > 0 ? (
              <>
                <span>•</span>
                <span className="text-red-300">{progress.failedScenes} failed</span>
              </>
            ) : null}
          </div>

          {statusMessage ? (
            <div className="mt-2 text-sm text-white/60">{statusMessage}</div>
          ) : null}

          <div className="mt-4">
            {nextAction.action === "build_scenes" ? (
              <GlassButton
                variant="primary"
                onClick={() =>
                  void runAction(
                    "generate",
                    `/api/shopreel/campaigns/${campaign.id}/generate`,
                    "Building scenes for your campaign..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "generate" ? "Working..." : "Build scenes"}
              </GlassButton>
            ) : null}

            {nextAction.action === "create_videos" ? (
              <GlassButton
                variant="primary"
                onClick={() =>
                  void runAction(
                    "run-jobs",
                    `/api/shopreel/campaigns/${campaign.id}/run-all-jobs`,
                    "Starting video generation..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "run-jobs" ? "Working..." : "Create videos"}
              </GlassButton>
            ) : null}

            {nextAction.action === "check_progress" ? (
              <GlassButton
                variant="primary"
                onClick={() =>
                  void runAction(
                    "sync",
                    `/api/shopreel/campaigns/${campaign.id}/sync-processing`,
                    "Checking progress and assembling finished videos..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "sync" ? "Working..." : "Check progress"}
              </GlassButton>
            ) : null}

            {nextAction.action === "publish" ? (
              <Link href={`/shopreel/publish-center?campaign=${campaign.id}`}>
                <GlassButton variant="primary">Publish campaign</GlassButton>
              </Link>
            ) : null}
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="text-xs text-white/50 hover:text-white/80"
              onClick={() => setShowAdvanced((value) => !value)}
            >
              {showAdvanced ? "Hide advanced controls" : "Show advanced controls"}
            </button>

            {showAdvanced ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <GlassButton
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "generate",
                      `/api/shopreel/campaigns/${campaign.id}/generate`,
                      "Building scenes for your campaign..."
                    )
                  }
                  disabled={anyBusy}
                >
                  {busy === "generate" ? "Working..." : "Build scenes again"}
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "run-jobs",
                      `/api/shopreel/campaigns/${campaign.id}/run-all-jobs`,
                      "Starting video generation..."
                    )
                  }
                  disabled={anyBusy}
                >
                  {busy === "run-jobs" ? "Working..." : "Create videos again"}
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "sync",
                      `/api/shopreel/campaigns/${campaign.id}/sync-processing`,
                      "Checking progress and assembling finished videos..."
                    )
                  }
                  disabled={anyBusy}
                >
                  {busy === "sync" ? "Working..." : "Check progress again"}
                </GlassButton>

                <Link href={`/shopreel/publish-center?campaign=${campaign.id}`}>
                  <GlassButton variant="ghost">Open publish page</GlassButton>
                </Link>

                <Link href="/shopreel/campaigns/new">
                  <GlassButton variant="ghost">New brief</GlassButton>
                </Link>

                <GlassButton
                  variant="ghost"
                  onClick={handleDeleteCampaign}
                  disabled={anyBusy}
                >
                  Delete campaign
                </GlassButton>
              </div>
            ) : null}
          </div>
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
        title="Campaign Videos"
        description="These are the videos inside this campaign."
        strong
      >
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
          Most of the time, you can use the main campaign action above and do not need
          to open each video individually.
        </div>

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
                      <GlassBadge tone="copper">Final video ready</GlassBadge>
                    ) : null}
                  </div>

                  <div className="text-sm text-white/70">{item.prompt}</div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link href={`/shopreel/campaigns/items/${item.id}`}>
                    <GlassButton variant="ghost">Open video details</GlassButton>
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
                <div className="flex flex-wrap items-center gap-2">
                  <GlassBadge tone="muted">{learning.learning_type}</GlassBadge>
                  {learning.confidence !== null ? (
                    <GlassBadge tone="default">
                      {Math.round(learning.confidence * 100)}% confidence
                    </GlassBadge>
                  ) : null}
                </div>
                <div className="mt-2 text-sm text-white">{learning.learning_key}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
