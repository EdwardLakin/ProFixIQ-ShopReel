"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import { cx } from "@/features/shopreel/ui/system/glassTheme";
import {
  VIDEO_CREATION_DURATIONS,
  VIDEO_CREATION_STYLE_DESCRIPTIONS,
  VIDEO_CREATION_STYLES,
  VIDEO_MUSIC_DIRECTIONS,
  VIDEO_VOICEOVER_MODES,
  formatLabel,
  type VideoCreationAspectRatio,
  type VideoCreationFormInput,
  type VideoCreationStyle,
  type VideoCreationVisualMode,
  type VideoMusicDirection,
  type VideoVoiceoverMode,
} from "@/features/shopreel/video-creation/lib/types";
import type { Database } from "@/types/supabase";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

type CreateJobResponse = {
  ok?: boolean;
  error?: string;
  job?: MediaJob;
  jobs?: MediaJob[];
  mediaJob?: { id?: string };
  id?: string;
};

const STARTER_PROMPTS = [
  "Create a 20-second product demo reel from this concept.",
  "Turn this into a founder-led short with a practical CTA.",
  "Make this feel like a clean app launch video for Instagram and Facebook.",
  "Create a punchy before/after style reel with captions.",
];

function readCreatePrefill(): string {
  const params = new URLSearchParams(window.location.search);
  const promptFromParams = params.get("prompt");
  if (promptFromParams) return promptFromParams;

  const storedRaw = window.localStorage.getItem("shopreel:createPrefill");
  if (!storedRaw) return "";

  try {
    const stored = JSON.parse(storedRaw) as { prompt?: unknown };
    return typeof stored.prompt === "string" ? stored.prompt : "";
  } catch {
    return "";
  }
}

function musicDescription(value: VideoMusicDirection) {
  return VIDEO_MUSIC_DIRECTIONS.find((item) => item.value === value)?.description ?? "";
}

function voiceDescription(value: VideoVoiceoverMode) {
  return VIDEO_VOICEOVER_MODES.find((item) => item.value === value)?.description ?? "";
}

function styleToVisualMode(style: VideoCreationStyle): VideoCreationVisualMode {
  if (style === "cartoon") return "cartoon";
  if (style === "animated") return "animated";
  if (style === "cinematic") return "moody";
  if (style === "ugc" || style === "founder_led") return "photoreal";
  if (style === "product_demo") return "brand_clean";
  return "photoreal";
}

function buildTitle(prompt: string) {
  const firstLine = prompt.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "AI video";
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}

export default function VideoBriefWizard({ recentJobs }: { recentJobs: MediaJob[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<MediaJob[]>(recentJobs);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<VideoCreationStyle>("realistic");
  const [durationSeconds, setDurationSeconds] = useState<number>(20);
  const [voiceoverMode, setVoiceoverMode] = useState<VideoVoiceoverMode>("ai_voice");
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [musicDirection, setMusicDirection] = useState<VideoMusicDirection>("modern_product_demo");
  const [customMusicDirection, setCustomMusicDirection] = useState("");
  const [aspectRatio] = useState<VideoCreationAspectRatio>("9:16");
  const [submitting, setSubmitting] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshingJobs, setRefreshingJobs] = useState(false);

  useEffect(() => {
    setJobs(recentJobs);
  }, [recentJobs]);

  const visualMode = useMemo(() => styleToVisualMode(style), [style]);

  useEffect(() => {
    const prefill = readCreatePrefill();
    if (prefill) {
      setPrompt(prefill);
      setMessage("Loaded your approved idea. Choose style, duration, voice, and music direction, then create the video job.");
    }
  }, []);

  const preview = useMemo(() => {
    const music =
      musicDirection === "custom"
        ? customMusicDirection || "custom music direction"
        : VIDEO_MUSIC_DIRECTIONS.find((item) => item.value === musicDirection)?.label ?? "Music direction";

    return [
      `Style: ${formatLabel(style)}`,
      `Visual mode: ${formatLabel(visualMode)}`,
      `Duration: ${durationSeconds}s`,
      `Voiceover: ${VIDEO_VOICEOVER_MODES.find((item) => item.value === voiceoverMode)?.label ?? "AI voiceover"}`,
      `Music: ${music}`,
      `Format: vertical ${aspectRatio}`,
    ];
  }, [aspectRatio, customMusicDirection, durationSeconds, musicDirection, style, visualMode, voiceoverMode]);

  async function createVideoJob() {
    try {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        setError("Tell ShopReel what video to create first.");
        return;
      }

      setSubmitting(true);
      setError(null);
      setMessage(null);

      const payload: VideoCreationFormInput = {
        title: buildTitle(trimmedPrompt),
        prompt: trimmedPrompt,
        negativePrompt:
          "Avoid unreadable text, distorted UI, fake logos, extra fingers, broken anatomy, chaotic cuts, and copyrighted music references.",
        jobType: "video",
        provider: "openai",
        style,
        visualMode,
        aspectRatio,
        durationSeconds,
        inputAssetIds: [],
        voiceoverMode,
        voiceoverScript,
        musicDirection,
        customMusicDirection,
      };

      const res = await fetch("/api/shopreel/video-creation/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as CreateJobResponse;

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create video job.");
      }

      const createdJob = json.job ?? null;
      if (createdJob?.id) {
        setJobs((current) => [createdJob, ...current.filter((job) => job.id !== createdJob.id)]);
      }

      const jobId = createdJob?.id ?? json.mediaJob?.id ?? json.id ?? null;
      if (!jobId) {
        throw new Error("Video job was created but response did not include a job id.");
      }

      setMessage("Video job created and started. It may take a moment to appear as processing.");
      window.localStorage.removeItem("shopreel:createPrefill");

      const runError = await runJob(jobId);
      if (runError) {
        throw new Error(`Video job was created but could not be started: ${runError}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create video job.");
    } finally {
      setSubmitting(false);
    }
  }

  async function runJob(jobId: string): Promise<string | null> {
    try {
      setRunningJobId(jobId);
      setError(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/run`, {
        method: "POST",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; job?: MediaJob };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to start video generation.");
      }

      if (json.job?.id) {
        setJobs((current) => current.map((job) => (job.id === json.job?.id ? { ...job, ...json.job } : job)));
      } else {
        setJobs((current) =>
          current.map((job) => (job.id === jobId ? { ...job, status: "processing", started_at: new Date().toISOString() } : job))
        );
      }
      setMessage("Video job created and started. It may take a moment to appear as processing.");
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Failed to start video generation.";
    } finally {
      setRunningJobId(null);
    }
  }

  async function refreshJobs() {
    try {
      setRefreshingJobs(true);
      const res = await fetch("/api/shopreel/video-creation/jobs?limit=24", { method: "GET" });
      const json = (await res.json()) as CreateJobResponse;
      if (!res.ok || !json.ok || !json.jobs) {
        throw new Error(json.error ?? "Failed to refresh recent jobs.");
      }
      setJobs(json.jobs);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh recent jobs.");
    } finally {
      setRefreshingJobs(false);
    }
  }

  async function syncJob(jobId: string) {
    try {
      setSyncingJobId(jobId);
      setError(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/sync`, {
        method: "POST",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; completed?: boolean };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to sync video job.");
      }

      setMessage(json.completed ? "Video completed and imported." : "Video is still processing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync video job.");
    } finally {
      setSyncingJobId(null);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <GlassCard label="AI video brief" title="Create a reel without learning an editor" strong>
          <div className="space-y-4">
            <p className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-white/75">
              Describe the video. ShopReel handles the brief, style, voiceover direction, music mood, and generation handoff. Power-user editing stays available later in Editor.
            </p>

            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.18em] text-white/45">What should the video be?</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: Create a 20-second founder-led reel for PayProof explaining why flat-rate techs need payday proof before payday."
                className="min-h-44 w-full rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/40 focus:border-cyan-300/40"
              />
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPrompt((current) => current.trim() ? `${current}\n\n${item}` : item)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/72 transition hover:bg-white/[0.08]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard label="Creative direction" title="Pick the style" strong>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {VIDEO_CREATION_STYLES.slice(0, 9).map((item) => {
              const selected = item === style;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setStyle(item)}
                  className={cx(
                    "rounded-2xl border p-3 text-left transition hover:-translate-y-0.5",
                    selected
                      ? "border-cyan-300/35 bg-cyan-400/[0.12] text-white shadow-[0_12px_35px_rgba(34,211,238,0.16)]"
                      : "border-white/10 bg-black/25 text-white/75 hover:bg-white/[0.06]"
                  )}
                >
                  <div className="text-sm font-semibold">{formatLabel(item)}</div>
                  <p className="mt-1 text-xs leading-5 text-white/55">{VIDEO_CREATION_STYLE_DESCRIPTIONS[item]}</p>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard label="Timing and sound" title="Duration, voiceover, and music mood" strong>
          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">Duration</div>
              <div className="grid grid-cols-4 gap-2">
                {VIDEO_CREATION_DURATIONS.map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => setDurationSeconds(seconds)}
                    className={cx(
                      "rounded-xl border px-3 py-2 text-sm transition",
                      durationSeconds === seconds
                        ? "border-violet-300/35 bg-violet-400/[0.14] text-white"
                        : "border-white/10 bg-black/25 text-white/70 hover:bg-white/[0.06]"
                    )}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-white/45">Voiceover</span>
              <select
                value={voiceoverMode}
                onChange={(event) => setVoiceoverMode(event.target.value as VideoVoiceoverMode)}
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                {VIDEO_VOICEOVER_MODES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <span className="text-xs text-white/50">{voiceDescription(voiceoverMode)}</span>
            </label>

            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-white/45">Music mood</span>
              <select
                value={musicDirection}
                onChange={(event) => setMusicDirection(event.target.value as VideoMusicDirection)}
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
              >
                {VIDEO_MUSIC_DIRECTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <span className="text-xs text-white/50">{musicDescription(musicDirection)}</span>
            </label>
          </div>

          {musicDirection === "custom" ? (
            <input
              value={customMusicDirection}
              onChange={(event) => setCustomMusicDirection(event.target.value)}
              placeholder="Describe the music mood, tempo, or reference style. Use licensed/user-owned music later."
              className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none"
            />
          ) : null}

          <textarea
            value={voiceoverScript}
            onChange={(event) => setVoiceoverScript(event.target.value)}
            placeholder="Optional: write voiceover/script direction. Example: Calm technician-to-technician voice, practical and not salesy."
            rows={3}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
          />
        </GlassCard>

        {error ? (
          <div className="rounded-2xl border border-rose-300/35 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/[0.07] p-4 text-sm text-cyan-50">
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <GlassButton onClick={() => void createVideoJob()} disabled={submitting || Boolean(runningJobId)}>
            {submitting || runningJobId ? "Creating video…" : "Create video"}
          </GlassButton>
          <Link href="/shopreel/editor">
            <GlassButton variant="ghost">Open power editor</GlassButton>
          </Link>
        </div>
      </section>

      <aside className="space-y-4">
        <GlassCard label="Brief summary" title="What ShopReel will build">
          <div className="space-y-2">
            {preview.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/75">
                {item}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard label="Music note" title="Trending-style music">
          <p className="text-sm leading-6 text-white/65">
            ShopReel uses music direction as mood and tempo guidance. Actual copyrighted tracks should be user-provided or licensed before posting.
          </p>
        </GlassCard>

        <GlassCard label="Recent jobs" title="Video generation queue">
          <div className="mb-3 flex justify-end">
            <GlassButton variant="ghost" onClick={() => void refreshJobs()} disabled={refreshingJobs}>
              {refreshingJobs ? "Refreshing…" : "Refresh"}
            </GlassButton>
          </div>
          {jobs.length === 0 ? (
            <p className="text-sm leading-6 text-white/60">No video jobs yet. Create your first one from the brief.</p>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 8).map((job) => {
                const canRun = job.status === "queued" || job.status === "failed";
                const canSync = job.provider === "openai" && job.job_type === "video" && job.status === "processing";

                return (
                  <div key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{job.title ?? "Untitled video"}</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <GlassBadge tone="muted">{job.status}</GlassBadge>
                          {job.style ? <GlassBadge tone="muted">{formatLabel(job.style)}</GlassBadge> : null}
                          {job.duration_seconds ? <GlassBadge tone="muted">{job.duration_seconds}s</GlassBadge> : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {canRun ? (
                        <GlassButton
                          variant="ghost"
                          onClick={() => void runJob(job.id).then((runError) => runError && setError(runError))}
                          disabled={runningJobId === job.id}
                        >
                          {runningJobId === job.id ? "Starting…" : "Start"}
                        </GlassButton>
                      ) : null}
                      {canSync ? (
                        <GlassButton variant="ghost" onClick={() => void syncJob(job.id)} disabled={syncingJobId === job.id}>
                          {syncingJobId === job.id ? "Syncing…" : "Check result"}
                        </GlassButton>
                      ) : null}
                      {job.preview_url ? (
                        <a href={job.preview_url} target="_blank" rel="noreferrer" className="text-xs text-cyan-200 underline">
                          Open preview
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </aside>
    </div>
  );
}
