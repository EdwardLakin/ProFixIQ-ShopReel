"use client";

import { useMemo, useState } from "react";
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

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

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
}: {
  recentJobs: MediaJob[];
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

  const [submitting, setSubmitting] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recommendedProvider = useMemo(() => {
    if (jobType === "asset_assembly") return "assembly";
    return provider;
  }, [jobType, provider]);

  function selectJobType(nextType: VideoCreationJobType) {
    setJobType(nextType);
    const suggested = suggestDefaultDuration(nextType);
    if (suggested) setDurationSeconds(suggested);
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

  async function submitJob() {
    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

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
        inputAssetIds: [],
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

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Studio"
        title="AI Video Creation"
        description="Create visuals, clips, and assembled reels with a serious AI media studio workflow."
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
              <div className="grid gap-3 md:grid-cols-3">
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

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Title
                  </span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brake inspection cinematic reveal"
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
                    placeholder="Create a cinematic vertical video showing a heavy-duty brake inspection in a modern repair shop with dramatic light, close-up mechanical detail, premium startup style."
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
                    placeholder="Avoid blurry frames, distorted hands, unreadable text, low detail, extra wheels, low realism."
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>
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
                    ? "Use this for concept stills, thumbnails, scene art, title cards, and visual inserts."
                    : jobType === "video"
                      ? "Use this for short cinematic B-roll, hero clips, explainers, and premium social motion."
                      : "Use this to turn uploaded or existing assets into a polished vertical reel foundation."}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <GlassButton variant="primary" onClick={() => void submitJob()} disabled={submitting}>
                  {submitting ? "Creating..." : "Create media job"}
                </GlassButton>
              </div>

              {message ? (
                <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div>
              ) : null}

              {error ? (
                <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div>
              ) : null}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard
        label="Recent"
        title="Recent generation jobs"
        description="Create, process, and review your recent AI media generation runs."
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
          <div className="grid gap-3">
            {recentJobs.map((job) => (
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
                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone={statusTone(job.status)}>{job.status}</GlassBadge>
                      <GlassBadge tone="default">{job.aspect_ratio}</GlassBadge>
                      {job.style ? <GlassBadge tone="muted">{formatLabel(job.style)}</GlassBadge> : null}
                      {job.visual_mode ? (
                        <GlassBadge tone="muted">{formatLabel(job.visual_mode)}</GlassBadge>
                      ) : null}
                    </div>
                    {job.error_text ? (
                      <div className={cx("text-sm", glassTheme.text.copperSoft)}>
                        {job.error_text}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(job.status === "queued" || job.status === "failed") ? (
                      <GlassButton
                        variant="secondary"
                        onClick={() => void runJob(job.id)}
                        disabled={runningJobId === job.id}
                      >
                        {runningJobId === job.id ? "Running..." : "Run Now"}
                      </GlassButton>
                    ) : null}

                    {job.output_asset_id ? (
                      <GlassButton variant="ghost">
                        Asset Ready
                      </GlassButton>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
