"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { formatShopReelStatus } from "@/features/shopreel/lib/uiLabels";

type CampaignRow = Database["public"]["Tables"]["shopreel_campaigns"]["Row"];
type CampaignAnalyticsRow = Database["public"]["Tables"]["shopreel_campaign_analytics"]["Row"];
type CampaignLearningRow = Database["public"]["Tables"]["shopreel_campaign_learnings"]["Row"];
type MediaJobLite = Pick<
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"],
  | "id"
  | "status"
  | "provider"
  | "preview_url"
  | "output_asset_id"
  | "source_content_piece_id"
  | "source_generation_id"
  | "error_text"
  | "created_at"
  | "updated_at"
>;

type CampaignItemRow = Database["public"]["Tables"]["shopreel_campaign_items"]["Row"] & {
  media_job?: MediaJobLite | MediaJobLite[] | null;
};

function normalizeMediaJob(
  value: CampaignItemRow["media_job"]
): MediaJobLite | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
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
  analytics: CampaignAnalyticsRow | null;
  learnings: CampaignLearningRow[];
  progress: {
    totalItems: number;
    completedItems: number;
    progressPercent: number;
  };
}) {
  const router = useRouter();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [batchCreating, setBatchCreating] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [syncingProcessing, setSyncingProcessing] = useState(false);
  const [rollingUp, setRollingUp] = useState(false);
  const [learning, setLearning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createMediaJob(itemId: string) {
    try {
      setWorkingId(itemId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/items/${itemId}/create-job`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create media job");
      }

      setMessage("Media job created from campaign item.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create media job");
    } finally {
      setWorkingId(null);
    }
  }

  async function runMediaJob(itemId: string) {
    try {
      setWorkingId(itemId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/items/${itemId}/run-job`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to run media job");
      }

      setMessage("Campaign item media job processed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run media job");
    } finally {
      setWorkingId(null);
    }
  }

  async function createAllMediaJobs() {
    try {
      setBatchCreating(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/create-all-jobs`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create campaign jobs");
      }

      setMessage("Media jobs created for campaign.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign jobs");
    } finally {
      setBatchCreating(false);
    }
  }

  async function runAllMediaJobs() {
    try {
      setBatchRunning(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/run-all-jobs`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to run campaign jobs");
      }

      setMessage("Campaign media jobs processed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run campaign jobs");
    } finally {
      setBatchRunning(false);
    }
  }

  async function generateCampaign() {
    try {
      setGenerating(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/generate`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to generate campaign");
      }

      setMessage("Campaign generation pipeline completed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate campaign");
    } finally {
      setGenerating(false);
    }
  }

  async function syncProcessingJobs() {
    try {
      setSyncingProcessing(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/sync-processing`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to sync processing jobs");
      }

      setMessage("Processing jobs synced.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync processing jobs");
    } finally {
      setSyncingProcessing(false);
    }
  }

  async function rollupAnalytics() {
    try {
      setRollingUp(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/rollup`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to roll up analytics");
      }

      setMessage("Campaign analytics rolled up.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to roll up analytics");
    } finally {
      setRollingUp(false);
    }
  }

  async function learnFromCampaign() {
    try {
      setLearning(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/campaigns/${campaign.id}/learn`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to learn from campaign");
      }

      setMessage("Campaign learnings extracted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to learn from campaign");
    } finally {
      setLearning(false);
    }
  }

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Progress"
        title="Campaign Progress"
        description="Track how many campaign videos have completed."
        strong
      >
        <div className="space-y-4">
          <div className={cx("text-3xl font-semibold", glassTheme.text.primary)}>
            {progress.progressPercent}%
          </div>

          <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300/80 via-blue-400/80 to-emerald-300/80 transition-all"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>

          <div className={cx("text-sm", glassTheme.text.secondary)}>
            {progress.completedItems} / {progress.totalItems} videos generated
          </div>
        </div>
      </GlassCard>
      <GlassCard
        label="Angles"
        title="Campaign items"
        description="Each item becomes a video concept, media job, and content piece."
        strong
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <GlassButton variant="secondary" onClick={() => void createAllMediaJobs()} disabled={batchCreating}>
            {batchCreating ? "Creating..." : "Create All Media Jobs"}
          </GlassButton>
          <GlassButton variant="secondary" onClick={() => void runAllMediaJobs()} disabled={batchRunning}>
            {batchRunning ? "Running..." : "Run All Jobs"}
          </GlassButton>
          <GlassButton variant="secondary" onClick={() => void syncProcessingJobs()} disabled={syncingProcessing}>
            {syncingProcessing ? "Syncing..." : "Sync Processing Jobs"}
          </GlassButton>
          <GlassButton variant="secondary" onClick={() => void rollupAnalytics()} disabled={rollingUp}>
            {rollingUp ? "Rolling up..." : "Roll Up Analytics"}
          </GlassButton>
          <GlassButton variant="secondary" onClick={() => void learnFromCampaign()} disabled={learning}>
            {learning ? "Learning..." : "Learn From Campaign"}
          </GlassButton>
          <GlassButton variant="primary" onClick={() => void generateCampaign()} disabled={generating}>
            {generating ? "Generating..." : "Generate Campaign"}
          </GlassButton>
        </div>

        {message ? <div className={cx("mb-3 text-sm", glassTheme.text.copperSoft)}>{message}</div> : null}
        {error ? <div className={cx("mb-3 text-sm", glassTheme.text.copperSoft)}>{error}</div> : null}

        <div className="grid gap-3">
          {items.map((item) => {
            const mediaJob = normalizeMediaJob(item.media_job);

            return (
              <div
                key={item.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {item.title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {item.angle}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <GlassBadge tone="default">{formatShopReelStatus(item.status)}</GlassBadge>
                      <GlassBadge tone="muted">{item.aspect_ratio}</GlassBadge>
                      {item.style ? <GlassBadge tone="muted">{item.style}</GlassBadge> : null}
                      {mediaJob?.status ? (
                        <GlassBadge tone={mediaJob.status === "completed" ? "copper" : "default"}>
                          Job: {mediaJob.status}
                        </GlassBadge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link href={`/shopreel/campaigns/items/${item.id}`}>
                    <GlassButton variant="ghost">Open Item</GlassButton>
                  </Link>

                  {!item.media_job_id ? (
                    <GlassButton
                      variant="secondary"
                      onClick={() => void createMediaJob(item.id)}
                      disabled={workingId === item.id}
                    >
                      {workingId === item.id ? "Creating..." : "Create Media Job"}
                    </GlassButton>
                  ) : (
                    <GlassButton
                      variant="secondary"
                      onClick={() => void runMediaJob(item.id)}
                      disabled={workingId === item.id}
                    >
                      {workingId === item.id ? "Running..." : "Run Job"}
                    </GlassButton>
                  )}

                  {mediaJob?.source_content_piece_id ? (
                    <Link href={`/shopreel/content/${mediaJob.source_content_piece_id}`}>
                      <GlassButton variant="ghost">Open Content</GlassButton>
                    </Link>
                  ) : null}

                  {mediaJob?.source_content_piece_id ? (
                    <Link href="/shopreel/publish-center">
                      <GlassButton variant="ghost">Publish Center</GlassButton>
                    </Link>
                  ) : null}

                  {mediaJob?.source_generation_id ? (
                    <Link href={`/shopreel/editor/video/${mediaJob.source_generation_id}`}>
                      <GlassButton variant="ghost">Open Editor</GlassButton>
                    </Link>
                  ) : null}
                  </div>
                </div>

                <div
                  className={cx(
                    "mt-4 rounded-2xl border p-4 text-sm whitespace-pre-wrap",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.primary
                  )}
                >
                  {item.prompt}
                </div>

                {mediaJob?.preview_url ? (
                  <div className="pt-4">
                    <video
                      src={mediaJob.preview_url}
                      controls
                      playsInline
                      className="max-h-56 rounded-2xl border border-white/10"
                    />
                  </div>
                ) : null}

                {mediaJob?.error_text ? (
                  <div className={cx("pt-3 text-sm", glassTheme.text.copperSoft)}>
                    {mediaJob.error_text}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </GlassCard>

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="Analytics"
          title="Campaign rollup"
          description="Aggregate performance across the campaign."
          strong
        >
          {!analytics ? (
            <div className={cx("text-sm", glassTheme.text.secondary)}>
              No analytics rollup yet.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Total items", analytics.total_items],
                ["Media jobs", analytics.total_media_jobs],
                ["Completed jobs", analytics.total_completed_jobs],
                ["Content pieces", analytics.total_content_pieces],
                ["Publications", analytics.total_publications],
                ["Published", analytics.total_published],
                ["Views", analytics.total_views],
                ["Engagement", analytics.total_engagement],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    {label}
                  </div>
                  <div className={cx("mt-2 text-lg font-medium", glassTheme.text.primary)}>
                    {String(value)}
                  </div>
                </div>
              ))}

              <div
                className={cx(
                  "rounded-2xl border p-4 md:col-span-2",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                  Winning angle
                </div>
                <div className={cx("mt-2 text-base font-medium", glassTheme.text.primary)}>
                  {analytics.winning_angle ?? "No winner yet"}
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Learnings"
          title="What the system learned"
          description="Signals that can be fed into the next campaign."
          strong
        >
          {learnings.length === 0 ? (
            <div className={cx("text-sm", glassTheme.text.secondary)}>
              No learnings extracted yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {learnings.map((learningRow) => (
                <div
                  key={learningRow.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <GlassBadge tone="default">{learningRow.learning_type}</GlassBadge>
                    <GlassBadge tone="muted">{learningRow.learning_key}</GlassBadge>
                    {learningRow.confidence != null ? (
                      <GlassBadge tone="copper">confidence {learningRow.confidence}</GlassBadge>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
