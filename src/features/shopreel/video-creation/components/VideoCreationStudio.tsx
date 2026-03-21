"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import {
  VIDEO_CREATION_ASPECT_RATIOS,
  VIDEO_CREATION_JOB_TYPES,
  VIDEO_CREATION_PROVIDERS,
  VIDEO_CREATION_STYLES,
  VIDEO_CREATION_VISUAL_MODES,
  formatLabel,
  suggestDefaultDuration,
  type VideoCreationFormInput,
  type VideoCreationJobType,
  type VideoCreationProvider,
  type VideoCreationStyle,
  type VideoCreationVisualMode,
  type VideoCreationAspectRatio,
} from "@/features/shopreel/video-creation/lib/types";
import { VIDEO_CREATION_PRESETS } from "@/features/shopreel/video-creation/lib/presets";
import { getMediaJobPrimaryAction } from "@/features/shopreel/video-creation/lib/editor";
import {
  getMediaJobSeriesInfo,
  groupMediaJobsIntoSeries,
} from "@/features/shopreel/video-creation/lib/series";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];
type SelectableAsset = Pick<
  Database["public"]["Tables"]["content_assets"]["Row"],
  "id" | "title" | "asset_type" | "public_url" | "created_at" | "metadata"
>;

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

function statusTone(status: string): "default" | "copper" | "muted" {
  if (status === "completed") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

export default function VideoCreationStudio({
  recentJobs,
  selectableAssets,
}: {
  recentJobs: MediaJob[];
  selectableAssets: SelectableAsset[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [jobType, setJobType] = useState<VideoCreationJobType>("video");
  const [provider, setProvider] = useState<VideoCreationProvider>("openai");
  const [style, setStyle] = useState<VideoCreationStyle>("cinematic");
  const [visualMode, setVisualMode] = useState<VideoCreationVisualMode>("photoreal");
  const [aspectRatio, setAspectRatio] = useState<VideoCreationAspectRatio>("9:16");
  const [durationSeconds, setDurationSeconds] = useState<number>(8);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [convertingJobId, setConvertingJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recommendedProvider = useMemo(() => {
    if (jobType === "asset_assembly") return "assembly";
    return provider;
  }, [jobType, provider]);

  const seriesGroups = useMemo(() => groupMediaJobsIntoSeries(recentJobs), [recentJobs]);
  const standaloneJobs = useMemo(
    () => recentJobs.filter((job) => !getMediaJobSeriesInfo(job).seriesKey),
    [recentJobs]
  );

  function toggleAsset(assetId: string) {
    setSelectedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    );
  }

  function selectJobType(nextType: VideoCreationJobType) {
    setJobType(nextType);
    const suggested = suggestDefaultDuration(nextType);
    if (typeof suggested === "number") setDurationSeconds(suggested);
  }

  function applyPreset(presetId: string) {
    const preset = VIDEO_CREATION_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    setTitle(preset.title);
    setPrompt(preset.prompt);
    setNegativePrompt(preset.negativePrompt);
    setJobType(preset.jobType);
    setStyle(preset.style);
    setVisualMode(preset.visualMode);
    setAspectRatio(preset.aspectRatio);
    if (preset.durationSeconds) setDurationSeconds(preset.durationSeconds);
  }

  async function enhancePrompt() {
    try {
      setEnhancing(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/shopreel/video-creation/enhance-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          style,
          visualMode,
          aspectRatio,
          durationSeconds: jobType === "image" ? null : durationSeconds,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to enhance prompt");
      }

      setPrompt(json.enhancedPrompt ?? prompt);
      setMessage("Prompt enhanced with brand voice.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enhance prompt");
    } finally {
      setEnhancing(false);
    }
  }

  async function submitJob() {
    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      if (jobType === "asset_assembly" && selectedAssetIds.length === 0) {
        throw new Error("Select at least one asset for asset assembly.");
      }

      if (jobType === "series") {
        if (selectedAssetIds.length === 0) {
          throw new Error("Select uploaded assets first. Build Series is now uploaded-media-first.");
        }

        const seriesRes = await fetch("/api/shopreel/video-creation/series", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            prompt,
            negativePrompt,
            provider: recommendedProvider,
            style,
            visualMode,
            aspectRatio,
            durationSeconds,
            inputAssetIds: selectedAssetIds,
            allowAiConcepts: false,
          }),
        });

        const seriesJson = await seriesRes.json();

        if (!seriesRes.ok || !seriesJson.ok) {
          throw new Error(seriesJson.error ?? "Failed to create series");
        }

        setMessage(`Series created with ${seriesJson.count ?? 4} queued clips.`);
        router.push(`/shopreel/video-creation/series/${seriesJson.seriesKey}`);
        router.refresh();
        return;
      }

      const payload: VideoCreationFormInput = {
        title,
        prompt,
        negativePrompt,
        jobType,
        provider: recommendedProvider as VideoCreationProvider,
        style,
        visualMode,
        aspectRatio,
        durationSeconds: jobType === "image" ? null : durationSeconds,
        inputAssetIds: selectedAssetIds,
      };

      const res = await fetch("/api/shopreel/video-creation/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create generation job");
      }

      setMessage("Media generation job created.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create generation job");
    } finally {
      setSubmitting(false);
    }
  }

  async function runJob(jobId: string) {
    try {
      setRunningJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/run`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to run generation job");
      }

      setMessage("Media generation job processed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run generation job");
    } finally {
      setRunningJobId(null);
    }
  }

  async function syncJob(jobId: string) {
    try {
      setSyncingJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/sync`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to sync generation job");
      }

      setMessage(json.completed ? "Video job completed and imported." : "Video job synced.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync generation job");
    } finally {
      setSyncingJobId(null);
    }
  }

  async function createStoryboard(jobId: string) {
    try {
      setActionJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/storyboard`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create storyboard");
      }

      setMessage("Storyboard created from media job.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create storyboard");
    } finally {
      setActionJobId(null);
    }
  }

  async function createThumbnail(jobId: string) {
    try {
      setActionJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/thumbnail`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create thumbnail");
      }

      setMessage("Thumbnail asset created from media job.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thumbnail");
    } finally {
      setActionJobId(null);
    }
  }

  async function convertToEditableStory(jobId: string) {
    try {
      setConvertingJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/convert`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to convert media job");
      }

      setMessage("Editable story created.");
      router.refresh();

      if (json.editorPath) {
        window.location.href = json.editorPath;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert media job");
    } finally {
      setConvertingJobId(null);
    }
  }

  const showAssetPicker = jobType === "asset_assembly" || jobType === "series";

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Studio"
        title="AI Video Creation"
        description="Create clips, build from assets, or create an uploaded-media-first series."
        strong
      >
        <div className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {VIDEO_CREATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={cx(
                  "rounded-2xl border p-4 text-left transition",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                  {preset.title}
                </div>
                <div className={cx("mt-1 text-xs leading-5", glassTheme.text.secondary)}>
                  {preset.description}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <GlassBadge tone="default">{formatLabel(preset.jobType)}</GlassBadge>
                  <GlassBadge tone="muted">{preset.aspectRatio}</GlassBadge>
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {VIDEO_CREATION_JOB_TYPES.map((item) => {
                  const active = item.value === jobType;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => selectJobType(item.value)}
                      className={cx(
                        "rounded-2xl border p-4 text-left transition",
                        active ? glassTheme.border.copper : glassTheme.border.softer,
                        glassTheme.glass.panelSoft
                      )}
                    >
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        {item.label}
                      </div>
                      <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {jobType === "series" ? (
                <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/[0.05] p-4">
                  <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Series structure
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {["Hook", "Problem", "Solution", "Outcome"].map((label, index) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                      >
                        <div className={cx("text-xs", glassTheme.text.muted)}>
                          Scene {index + 1}
                        </div>
                        <div className={cx("mt-1 text-sm font-medium", glassTheme.text.primary)}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={cx("mt-3 text-sm", glassTheme.text.secondary)}>
                    Build Series is now designed for uploaded media first. It creates four coordinated clips from one idea using the same visual direction.
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Title
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Launch idea, offer, or story title"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Prompt
                  </span>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the story, offer, transformation, product, service, or message."
                    rows={6}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Negative prompt
                  </span>
                  <textarea
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="Avoid blur, distorted anatomy, unreadable text, duplicate objects, inconsistent subjects."
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              {showAssetPicker ? (
                <div className="space-y-3">
                  <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    {jobType === "series" ? "Select uploaded assets for the series" : "Select assets"}
                  </div>

                  {selectableAssets.length === 0 ? (
                    <div
                      className={cx(
                        "rounded-2xl border p-4 text-sm",
                        glassTheme.border.softer,
                        glassTheme.glass.panelSoft,
                        glassTheme.text.secondary
                      )}
                    >
                      No assets available yet. Upload media first, then return here.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {selectableAssets.map((asset) => {
                        const active = selectedAssetIds.includes(asset.id);

                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => toggleAsset(asset.id)}
                            className={cx(
                              "rounded-2xl border p-4 text-left transition",
                              active ? glassTheme.border.copper : glassTheme.border.softer,
                              glassTheme.glass.panelSoft
                            )}
                          >
                            <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                              {asset.title ?? "Untitled asset"}
                            </div>
                            <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                              {formatLabel(asset.asset_type)} • {timeAgoLabel(asset.created_at)}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <GlassBadge tone={active ? "copper" : "default"}>
                                {active ? "Selected" : "Select"}
                              </GlassBadge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Provider
                  </span>
                  <select
                    value={recommendedProvider}
                    onChange={(e) => setProvider(e.target.value as VideoCreationProvider)}
                    disabled={jobType === "asset_assembly"}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  >
                    {VIDEO_CREATION_PROVIDERS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Style
                  </span>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as VideoCreationStyle)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  >
                    {VIDEO_CREATION_STYLES.map((item) => (
                      <option key={item} value={item}>
                        {formatLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Visual mode
                  </span>
                  <select
                    value={visualMode}
                    onChange={(e) => setVisualMode(e.target.value as VideoCreationVisualMode)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  >
                    {VIDEO_CREATION_VISUAL_MODES.map((item) => (
                      <option key={item} value={item}>
                        {formatLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Aspect ratio
                  </span>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as VideoCreationAspectRatio)}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  >
                    {VIDEO_CREATION_ASPECT_RATIOS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                {jobType !== "image" ? (
                  <label className="grid gap-2">
                    <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                      Duration (seconds)
                    </span>
                    <input
                      type="number"
                      min={3}
                      max={60}
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(Number(e.target.value))}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                    />
                  </label>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                  Best use
                </div>
                <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                  {jobType === "image"
                    ? "Use this for concept stills, thumbnails, scene art, and visual inserts."
                    : jobType === "video"
                      ? "Use this for one standalone clip."
                      : jobType === "series"
                        ? "Use this for a 4-part uploaded-media-first sequence: hook, problem, solution, outcome."
                        : "Use this to turn uploaded or existing assets into a polished vertical reel foundation."}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <GlassButton variant="secondary" onClick={() => void enhancePrompt()} disabled={enhancing}>
                  {enhancing ? "Enhancing..." : "Enhance Prompt"}
                </GlassButton>
                <GlassButton variant="primary" onClick={() => void submitJob()} disabled={submitting}>
                  {submitting ? "Creating..." : jobType === "series" ? "Create series" : "Create media job"}
                </GlassButton>
              </div>

              {message ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div> : null}
              {error ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div> : null}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard
        label="Recent"
        title="Recent generation jobs"
        description="Series are grouped together below. Standalone jobs remain separate."
        strong
      >
        {recentJobs.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No media generation jobs yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {seriesGroups.map((group) => (
              <div
                key={group.key}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {group.title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      Build Series • {group.jobs.length}
                      {group.totalScenes ? ` / ${group.totalScenes}` : ""} clips •{" "}
                      {group.sourceMode === "assets" ? "Uploaded media" : "AI concepts"} •{" "}
                      {timeAgoLabel(group.jobs[0]?.created_at ?? new Date().toISOString())}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone="default">{group.completedCount} completed</GlassBadge>
                      <GlassBadge tone="default">{group.processingCount} processing</GlassBadge>
                      <GlassBadge tone="default">{group.queuedCount} queued</GlassBadge>
                      {group.failedCount > 0 ? <GlassBadge tone="muted">{group.failedCount} failed</GlassBadge> : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/shopreel/video-creation/series/${group.key}`}>
                      <GlassButton variant="primary">Open series</GlassButton>
                    </Link>

                    {group.jobs.some((job) => job.status === "queued" || job.status === "failed") ? (
                      <GlassButton
                        variant="secondary"
                        onClick={() =>
                          void Promise.all(
                            group.jobs
                              .filter((job) => job.status === "queued" || job.status === "failed")
                              .map((job) => runJob(job.id))
                          )
                        }
                      >
                        Run series
                      </GlassButton>
                    ) : null}

                    {group.jobs.some(
                      (job) => job.provider === "openai" && job.job_type === "video" && job.status === "processing"
                    ) ? (
                      <GlassButton
                        variant="secondary"
                        onClick={() =>
                          void Promise.all(
                            group.jobs
                              .filter(
                                (job) =>
                                  job.provider === "openai" &&
                                  job.job_type === "video" &&
                                  job.status === "processing"
                              )
                              .map((job) => syncJob(job.id))
                          )
                        }
                      >
                        Sync series
                      </GlassButton>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {standaloneJobs.map((job) => {
              const primaryAction = getMediaJobPrimaryAction(job);
              const canDerive = job.status === "completed" && !!job.output_asset_id;

              return (
                <div
                  key={job.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {job.title ?? "Untitled media job"}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {formatLabel(job.job_type)} • {formatLabel(job.provider)} • {timeAgoLabel(job.created_at)}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <GlassBadge tone={statusTone(job.status)}>{job.status}</GlassBadge>
                        <GlassBadge tone="default">{job.aspect_ratio}</GlassBadge>
                        {job.style ? <GlassBadge tone="muted">{formatLabel(job.style)}</GlassBadge> : null}
                        {job.visual_mode ? <GlassBadge tone="muted">{formatLabel(job.visual_mode)}</GlassBadge> : null}
                        {job.output_asset_id ? <GlassBadge tone="copper">Asset ready</GlassBadge> : null}
                        {job.source_content_piece_id ? <GlassBadge tone="copper">Content linked</GlassBadge> : null}
                      </div>
                      {job.error_text ? (
                        <div className={cx("text-sm", glassTheme.text.copperSoft)}>
                          {job.error_text}
                        </div>
                      ) : null}

                      {job.preview_url ? (
                        <div className="pt-2">
                          {job.job_type === "image" ? (
                            <img
                              src={job.preview_url}
                              alt={job.title ?? "Generated preview"}
                              className="max-h-52 rounded-2xl border border-white/10 object-cover"
                            />
                          ) : (
                            <video
                              src={job.preview_url}
                              controls
                              playsInline
                              className="max-h-52 rounded-2xl border border-white/10"
                            />
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {(job.status === "queued" || job.status === "failed") ? (
                        <GlassButton
                          variant="secondary"
                          onClick={() => void runJob(job.id)}
                          disabled={runningJobId === job.id}
                        >
                          {runningJobId === job.id ? "Running..." : "Run Now"}
                        </GlassButton>
                      ) : null}

                      {job.provider === "openai" && job.job_type === "video" && job.status === "processing" ? (
                        <GlassButton
                          variant="secondary"
                          onClick={() => void syncJob(job.id)}
                          disabled={syncingJobId === job.id}
                        >
                          {syncingJobId === job.id ? "Syncing..." : "Sync Video"}
                        </GlassButton>
                      ) : null}

                      {canDerive ? (
                        <GlassButton
                          variant="secondary"
                          onClick={() => void createStoryboard(job.id)}
                          disabled={actionJobId === job.id}
                        >
                          {actionJobId === job.id ? "Working..." : "Create Storyboard"}
                        </GlassButton>
                      ) : null}

                      {canDerive ? (
                        <GlassButton
                          variant="secondary"
                          onClick={() => void createThumbnail(job.id)}
                          disabled={actionJobId === job.id}
                        >
                          {actionJobId === job.id ? "Working..." : "Generate Thumbnail"}
                        </GlassButton>
                      ) : null}

                      {canDerive && !job.source_generation_id ? (
                        <GlassButton
                          variant="secondary"
                          onClick={() => void convertToEditableStory(job.id)}
                          disabled={convertingJobId === job.id}
                        >
                          {convertingJobId === job.id ? "Converting..." : "Convert to Editable Story"}
                        </GlassButton>
                      ) : null}

                      {primaryAction.href && primaryAction.label ? (
                        <Link href={primaryAction.href}>
                          <GlassButton variant="ghost">{primaryAction.label}</GlassButton>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}