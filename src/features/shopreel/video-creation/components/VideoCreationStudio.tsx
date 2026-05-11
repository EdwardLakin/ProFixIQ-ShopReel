"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import {
  VIDEO_CREATION_ASPECT_RATIOS,
  VIDEO_CREATION_DURATIONS,
  VIDEO_CREATION_JOB_TYPES,
  VIDEO_CREATION_PROVIDERS,
  VIDEO_CREATION_STYLES,
  VIDEO_CREATION_STYLE_DESCRIPTIONS,
  VIDEO_CREATION_VISUAL_MODES,
  VIDEO_MUSIC_DIRECTIONS,
  VIDEO_VOICEOVER_MODES,
  formatLabel,
  suggestDefaultDuration,
  type VideoCreationFormInput,
  type VideoCreationJobType,
  type VideoCreationProvider,
  type VideoCreationStyle,
  type VideoCreationVisualMode,
  type VideoCreationAspectRatio,
  type VideoMusicDirection,
  type VideoVoiceoverMode,
} from "@/features/shopreel/video-creation/lib/types";
import { VIDEO_CREATION_PRESETS } from "@/features/shopreel/video-creation/lib/presets";
import { getMediaJobPrimaryAction } from "@/features/shopreel/video-creation/lib/editor";
import type { EnvHealth } from "@/features/shopreel/video-creation/lib/env";
import {
  getMediaJobSeriesInfo,
  groupMediaJobsIntoSeries,
  type MediaJobSeriesGroup,
} from "@/features/shopreel/video-creation/lib/seriesClient";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];
type SelectableAsset = Pick<
  Database["public"]["Tables"]["content_assets"]["Row"],
  "id" | "title" | "asset_type" | "public_url" | "created_at" | "metadata"
>;
type StoryboardSceneStatus = "ready" | "needs_media" | "needs_copy" | "draft";
type StoryboardScene = {
  id: string;
  sceneNumber: number;
  title: string;
  emotionalBeat: string;
  hookBeat: string;
  setupBeat: string;
  tensionBeat: string;
  payoffBeat: string;
  ctaBeat: string;
  voiceoverLine: string;
  captionText: string;
  visualDirection: string;
  pacingNotes: string;
  cameraFeel: string;
  transitionStyle: string;
  narrationTiming: string;
  editRhythm: string;
  platformAdaptation: string;
  narrativeArchetype: string;
  emotionalContinuityStage: "awareness" | "overwhelm" | "reflection" | "support" | "momentum" | "recovery";
  suggestedMediaSlot: string;
  durationSeconds: number;
  motionDirection: string;
  status: StoryboardSceneStatus;
};

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

function sourceLabelForJob(job: MediaJob) {
  const settings = (job.settings ?? {}) as Record<string, unknown>;
  if (typeof settings.storyboard_summary === "string" && settings.storyboard_summary.trim()) return "Storyboard";
  if (Array.isArray(job.input_asset_ids) && job.input_asset_ids.length > 0) return "Uploaded media";
  if (typeof settings.is_variation_of_job_id === "string" && settings.is_variation_of_job_id) return "Variation";
  return "Brief only";
}

const EMOTIONAL_CONTINUITY_ORDER: StoryboardScene["emotionalContinuityStage"][] = ["awareness", "overwhelm", "reflection", "support", "momentum", "recovery"];
const NARRATIVE_ARCHETYPES = ["POV", "Cinematic", "Testimonial", "Documentary", "Montage", "Founder story", "Emotional reset", "Educational"] as const;

export default function VideoCreationStudio({
  recentJobs,
  selectableAssets,
  envHealth,
}: {
  recentJobs: MediaJob[];
  selectableAssets: SelectableAsset[];
  envHealth: { state: EnvHealth; missing: string[] };
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
  const [durationSeconds, setDurationSeconds] = useState<number>(20);
  const [voiceoverMode, setVoiceoverMode] = useState<VideoVoiceoverMode>("ai_voice");
  const [voiceoverScript, setVoiceoverScript] = useState("");
  const [musicDirection, setMusicDirection] = useState<VideoMusicDirection>("modern_product_demo");
  const [customMusicDirection, setCustomMusicDirection] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [storyboardScenes, setStoryboardScenes] = useState<StoryboardScene[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [convertingJobId, setConvertingJobId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [deletingSeriesKey, setDeletingSeriesKey] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storyboardMessage, setStoryboardMessage] = useState<string | null>(null);

  const recommendedProvider = useMemo(() => {
    if (jobType === "asset_assembly") return "assembly";
    return provider;
  }, [jobType, provider]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storedRaw = window.localStorage.getItem("shopreel:createPrefill");

    let stored: { prompt?: string; contentType?: string; source?: string } | null = null;
    if (storedRaw) {
      try {
        stored = JSON.parse(storedRaw) as { prompt?: string; contentType?: string; source?: string };
      } catch {
        stored = null;
      }
    }

    const nextPrompt = params.get("prompt") || stored?.prompt || "";
    const source = params.get("source") || stored?.source || "";

    if (nextPrompt && !prompt.trim()) {
      setPrompt(nextPrompt);
      setTitle("AI video from approved concept");
      setJobType("video");
      setStyle("realistic");
      setVisualMode("photoreal");
      setDurationSeconds(20);
      setVoiceoverMode("ai_voice");
      setMusicDirection("modern_product_demo");
      setMessage(source === "review" ? "Loaded approved Review concept. Choose style/duration, then create the video job." : "Loaded creation prompt.");
    }
  }, [prompt]);

  const seriesGroups = useMemo<MediaJobSeriesGroup[]>(
    () => groupMediaJobsIntoSeries(recentJobs),
    [recentJobs]
  );

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

  function normalizeSceneStatus(scene: StoryboardScene): StoryboardSceneStatus {
    if (!scene.visualDirection.trim() && !scene.suggestedMediaSlot.trim()) return "needs_media";
    if (!scene.voiceoverLine.trim() && !scene.captionText.trim()) return "needs_copy";
    if (!scene.hookBeat.trim()) return "draft";
    return "ready";
  }

  function generateStoryboardFromBrief() {
    const sequence = ["Hook", "Problem / Context", "Proof / Demonstration", "Transformation / Value", "CTA"];
    const sceneCount = durationSeconds <= 15 ? 3 : durationSeconds >= 30 ? 5 : 4;
    const perScene = Math.max(3, Math.round(durationSeconds / sceneCount));
    const briefLabel = title.trim() || "Untitled concept";
    const promptFocus = prompt.trim() || "Core offer and message";

    const generated = sequence.slice(0, sceneCount).map((beat, index) => {
      const continuity = EMOTIONAL_CONTINUITY_ORDER[Math.min(index, EMOTIONAL_CONTINUITY_ORDER.length - 1)];
      const scene: StoryboardScene = {
        id: `scene-${Date.now()}-${index + 1}`,
        sceneNumber: index + 1,
        title: beat,
        emotionalBeat: continuity,
        hookBeat: `${beat} for ${briefLabel}`,
        setupBeat: `Ground the viewer in ${promptFocus.slice(0, 50)}`,
        tensionBeat: index < sceneCount - 1 ? "Escalate friction with real-world pressure." : "Resolve the final resistance.",
        payoffBeat: index >= 2 ? "Show tangible emotional or practical relief." : "Seed the transformation to come.",
        ctaBeat: index === sceneCount - 1 ? "Invite immediate next action with clarity." : "",
        voiceoverLine: voiceoverMode === "none" ? "" : `${beat}: ${promptFocus.slice(0, 90)}`,
        captionText: `${briefLabel} • ${beat}`,
        visualDirection: `${formatLabel(style)} ${formatLabel(visualMode)} direction in ${aspectRatio}, ${jobType} format`,
        pacingNotes: index === 0 ? "Fast hook cadence in first 2 seconds." : index === sceneCount - 1 ? "Intentional hold before CTA reveal." : "Keep cuts rhythmic and emotion-led.",
        cameraFeel: index === 0 ? "Static handheld, shallow depth." : index === sceneCount - 1 ? "Slow push-in with steady resolve." : "Subtle lateral drift with grounded realism.",
        transitionStyle: index === 0 ? "Hard cut to pattern interrupt." : "Match-cut with emotional continuity.",
        narrationTiming: voiceoverMode === "none" ? "No narration" : index === 0 ? "Front-load first line in 0.8s." : "Narration lands on scene midpoint.",
        editRhythm: "TikTok: 1.2s cuts • Reels: emotional hold • Shorts: text-forward rhythm",
        platformAdaptation: "Center-safe captions, vertical composition, hook text in upper third.",
        narrativeArchetype: NARRATIVE_ARCHETYPES[index % NARRATIVE_ARCHETYPES.length],
        emotionalContinuityStage: continuity,
        suggestedMediaSlot: selectedAssetIds.length > 0 ? `Asset ${Math.min(index + 1, selectedAssetIds.length)}` : "",
        durationSeconds: perScene,
        motionDirection: index === 0 ? "Push-in opener" : index === sceneCount - 1 ? "Hold with CTA reveal" : "Smooth lateral movement",
        status: "draft",
      };
      return { ...scene, status: normalizeSceneStatus(scene) };
    });

    setStoryboardScenes(generated);
    setStoryboardMessage("Draft storyboard generated from brief (local deterministic planner).");
  }

  function updateScene(sceneId: string, changes: Partial<StoryboardScene>) {
    setStoryboardScenes((current) =>
      current.map((scene) => {
        if (scene.id !== sceneId) return scene;
        const updated = { ...scene, ...changes };
        return { ...updated, status: normalizeSceneStatus(updated) };
      })
    );
  }

  function duplicateScene(sceneId: string) {
    setStoryboardScenes((current) => {
      const scene = current.find((item) => item.id === sceneId);
      if (!scene) return current;
      const clone: StoryboardScene = { ...scene, id: `scene-${Date.now()}-dup`, sceneNumber: scene.sceneNumber + 1 };
      const next = [...current, clone].map((item, index) => ({ ...item, sceneNumber: index + 1 }));
      return next;
    });
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

      const storyboardSummary = storyboardScenes.length
        ? storyboardScenes
            .map((scene) => `Scene ${scene.sceneNumber} ${scene.title} [${scene.emotionalContinuityStage}/${scene.narrativeArchetype}]: Hook ${scene.hookBeat}. Setup ${scene.setupBeat}. Tension ${scene.tensionBeat}. Payoff ${scene.payoffBeat}. CTA ${scene.ctaBeat || "none"}. Visual ${scene.visualDirection || scene.suggestedMediaSlot}. Camera ${scene.cameraFeel}. Pacing ${scene.pacingNotes}. Transition ${scene.transitionStyle}. Edit ${scene.editRhythm}. Voice: ${scene.voiceoverLine || "none"}. Caption: ${scene.captionText || "none"}. ${scene.durationSeconds}s.`)
            .join(" ")
        : "";

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
            voiceoverMode,
            voiceoverScript,
            musicDirection,
            customMusicDirection,
            storyboardSummary,
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
        voiceoverMode,
        voiceoverScript,
        musicDirection,
        customMusicDirection,
        storyboardSummary,
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

  async function bulkDeleteJobs(jobIds: string[], label: string) {
    try {
      const ids = Array.from(new Set(jobIds.filter(Boolean)));
      if (ids.length === 0) {
        throw new Error("Nothing to delete.");
      }

      const confirmed = window.confirm(`Delete ${label}? This removes the jobs and generated assets.`);
      if (!confirmed) return;

      setDeleting(true);
      setError(null);
      setMessage(null);

      const res = await fetch("/api/shopreel/video-creation/jobs/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobIds: ids,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete jobs");
      }

      setMessage(`${json.deletedCount ?? ids.length} job(s) deleted.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete jobs");
    } finally {
      setDeleting(false);
    }
  }

  async function deleteJob(jobId: string) {
    const confirmed = window.confirm("Delete this media job?");
    if (!confirmed) return;

    try {
      setDeletingJobId(jobId);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/jobs/${jobId}/delete`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete media job");
      }

      setMessage("Media job deleted.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete media job");
    } finally {
      setDeletingJobId(null);
    }
  }

  async function deleteSeries(seriesKey: string) {
    const confirmed = window.confirm("Delete this whole series and all clips in it?");
    if (!confirmed) return;

    try {
      setDeletingSeriesKey(seriesKey);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/video-creation/series/${seriesKey}/delete`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to delete series");
      }

      setMessage(`Series deleted (${json.deletedCount ?? 0} clips).`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete series");
    } finally {
      setDeletingSeriesKey(null);
    }
  }

  const showAssetPicker = jobType === "asset_assembly" || jobType === "series";
  const serviceUnavailable = envHealth.state !== "configured";
  const totalStoryboardDuration = storyboardScenes.reduce((sum, scene) => sum + Math.max(scene.durationSeconds, 0), 0);
  const storyboardReadinessMissing = storyboardScenes.flatMap((scene) => {
    const missing: string[] = [];
    if (!scene.visualDirection.trim() && !scene.suggestedMediaSlot.trim()) missing.push(`Scene ${scene.sceneNumber} needs visual direction`);
    if (!scene.voiceoverLine.trim() && !scene.captionText.trim()) missing.push(`Scene ${scene.sceneNumber} needs voice/caption copy`);
    return missing;
  });
  const readinessMissing = [
    !title.trim() ? "Add an idea title" : null,
    !prompt.trim() ? "Add a prompt/brief" : null,
    storyboardScenes.length === 0 ? "Add at least one scene" : null,
    showAssetPicker && selectedAssetIds.length === 0 ? "Select source media assets" : null,
    ...storyboardReadinessMissing,
    totalStoryboardDuration > 75 ? "Storyboard total duration exceeds recommended range" : null,
    !serviceUnavailable ? null : "Connect required render services",
  ].filter(Boolean) as string[];
  const renderReady = readinessMissing.length === 0;

  return (
    <div className="grid gap-5">
      {serviceUnavailable ? (
        <GlassCard label="Configuration" title="Video service not connected" description="Add the missing variables in your ShopReel env and Railway video service env." strong>
          <div className="space-y-3 text-sm text-white/80">
            <div>Missing: {envHealth.missing.join(", ")}</div>
            <div>Set <code>SHOPREEL_RAILWAY_VIDEO_BASE_URL</code> to your deployed Railway base URL (example: <code>https://your-railway-service.up.railway.app</code>).</div>
            <div>Set <code>SHOPREEL_RAILWAY_VIDEO_API_KEY</code> as the same shared secret in both ShopReel and Railway.</div>
            <details className="text-xs text-white/60"><summary className="cursor-pointer">Advanced debug details</summary><pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-black/35 p-2">{JSON.stringify(envHealth, null, 2)}</pre></details>
          </div>
        </GlassCard>
      ) : null}

      <GlassCard
        label="Advanced Video Studio"
        title="Idea to render command center"
        description="Build production-ready videos with script-first control and lifecycle-aware render actions."
        strong
      >
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-5">
            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>1. Idea & Brief</div>
              <label className="grid gap-2">
                <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Launch idea, offer, or story title" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" />
              </label>
              <label className="grid gap-2">
                <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Prompt</span>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the story, offer, transformation, product, service, or message." rows={5} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" />
              </label>
              <div className="flex flex-wrap gap-2">
                <GlassButton variant="secondary" onClick={() => void enhancePrompt()} disabled={enhancing}>{enhancing ? "Enhancing..." : "Enhance Prompt"}</GlassButton>
                <GlassButton variant="primary" onClick={() => void submitJob()} disabled={submitting || serviceUnavailable}>{serviceUnavailable ? "Service unavailable" : submitting ? "Creating..." : jobType === "series" ? "Create series" : "Create media job"}</GlassButton>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Presets</div>
              <div className="grid gap-2 md:grid-cols-2">
            {VIDEO_CREATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={cx(
                  "rounded-xl border p-3 text-left transition",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>{preset.title}</div>
                  <div className={cx("text-xs", glassTheme.text.secondary)}>{preset.aspectRatio}</div>
                </div>
                <div className={cx("mt-1 text-xs leading-5", glassTheme.text.secondary)}>{preset.description}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <GlassBadge tone="default">{formatLabel(preset.jobType)}</GlassBadge>
                </div>
              </button>
            ))}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>2. Media Inputs</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {VIDEO_CREATION_JOB_TYPES.map((item) => {
                  const active = item.value === jobType;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => selectJobType(item.value)}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-left transition",
                        active ? glassTheme.border.copper : glassTheme.border.softer,
                        glassTheme.glass.panelSoft
                      )}
                    >
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        {item.label}
                      </div>
                      <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>{item.description}</div>
                    </button>
                  );
                })}
              </div>
              {showAssetPicker ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {selectableAssets.length === 0 ? <div className={cx("rounded-xl border p-3 text-sm", glassTheme.border.softer, glassTheme.glass.panelSoft, glassTheme.text.secondary)}>No assets available yet. Upload media first.</div> : selectableAssets.map((asset) => {
                    const active = selectedAssetIds.includes(asset.id);
                    return <button key={asset.id} type="button" onClick={() => toggleAsset(asset.id)} className={cx("rounded-xl border p-3 text-left transition", active ? glassTheme.border.copper : glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className={cx("text-sm font-medium", glassTheme.text.primary)}>{asset.title ?? "Untitled asset"}</div><div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>{formatLabel(asset.asset_type)} • {timeAgoLabel(asset.created_at)}</div></button>;
                  })}
                </div>
              ) : null}
            </section>

            <section className="space-y-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.04] p-4">
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>3. AI Storyboard / Scene Plan</div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={cx("text-sm", glassTheme.text.secondary)}>Storyboard-first creative layer. Build scenes before deep render configuration.</div>
                <GlassButton variant="secondary" onClick={generateStoryboardFromBrief}>Generate storyboard</GlassButton>
              </div>
              {storyboardMessage ? <div className={cx("text-xs", glassTheme.text.copperSoft)}>{storyboardMessage}</div> : null}
              {storyboardScenes.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className={cx("text-xs uppercase tracking-[0.16em]", glassTheme.text.muted)}>Emotional continuity rail</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {storyboardScenes.map((scene) => (
                        <span key={`continuity-${scene.id}`} className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-1 text-white/80">
                          S{scene.sceneNumber} {formatLabel(scene.emotionalContinuityStage)}
                        </span>
                      ))}
                    </div>
                  </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {storyboardScenes.map((scene) => (
                    <div key={scene.id} className="rounded-2xl border border-white/15 bg-black/25 p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-xs text-white/60">Scene {scene.sceneNumber}</div>
                        <div className="flex items-center gap-2">
                          <GlassBadge tone="default">{scene.durationSeconds}s</GlassBadge>
                          <GlassBadge tone={scene.status === "ready" ? "copper" : "muted"}>{formatLabel(scene.status)}</GlassBadge>
                        </div>
                      </div>
                      <input value={scene.title} onChange={(e) => updateScene(scene.id, { title: e.target.value })} className="mb-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white" />
                      <div className="mb-2 grid gap-2 sm:grid-cols-2">
                        <input value={scene.emotionalBeat} onChange={(e) => updateScene(scene.id, { emotionalBeat: e.target.value })} placeholder="Emotional beat" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <select value={scene.emotionalContinuityStage} onChange={(e) => updateScene(scene.id, { emotionalContinuityStage: e.target.value as StoryboardScene["emotionalContinuityStage"] })} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white">
                          {EMOTIONAL_CONTINUITY_ORDER.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <input value={scene.hookBeat} onChange={(e) => updateScene(scene.id, { hookBeat: e.target.value })} placeholder="Hook" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.setupBeat} onChange={(e) => updateScene(scene.id, { setupBeat: e.target.value })} placeholder="Setup" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.tensionBeat} onChange={(e) => updateScene(scene.id, { tensionBeat: e.target.value })} placeholder="Tension" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.payoffBeat} onChange={(e) => updateScene(scene.id, { payoffBeat: e.target.value })} placeholder="Payoff" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.ctaBeat} onChange={(e) => updateScene(scene.id, { ctaBeat: e.target.value })} placeholder="CTA" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.voiceoverLine} onChange={(e) => updateScene(scene.id, { voiceoverLine: e.target.value })} placeholder="Voiceover line" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.captionText} onChange={(e) => updateScene(scene.id, { captionText: e.target.value })} placeholder="Overlay text" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.visualDirection} onChange={(e) => updateScene(scene.id, { visualDirection: e.target.value })} placeholder="Visual direction" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.cameraFeel} onChange={(e) => updateScene(scene.id, { cameraFeel: e.target.value })} placeholder="Camera feel" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.transitionStyle} onChange={(e) => updateScene(scene.id, { transitionStyle: e.target.value })} placeholder="Transition style" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.pacingNotes} onChange={(e) => updateScene(scene.id, { pacingNotes: e.target.value })} placeholder="Pacing notes" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.narrationTiming} onChange={(e) => updateScene(scene.id, { narrationTiming: e.target.value })} placeholder="Narration timing" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.editRhythm} onChange={(e) => updateScene(scene.id, { editRhythm: e.target.value })} placeholder="Edit rhythm" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.platformAdaptation} onChange={(e) => updateScene(scene.id, { platformAdaptation: e.target.value })} placeholder="Platform adaptation" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <input value={scene.narrativeArchetype} onChange={(e) => updateScene(scene.id, { narrativeArchetype: e.target.value })} placeholder="Narrative archetype" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        <div className="grid grid-cols-2 gap-2">
                          <input value={scene.suggestedMediaSlot} onChange={(e) => updateScene(scene.id, { suggestedMediaSlot: e.target.value })} placeholder="Media slot" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                          <input type="number" min={3} max={30} value={scene.durationSeconds} onChange={(e) => updateScene(scene.id, { durationSeconds: Number(e.target.value) || 3 })} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                        </div>
                        <input value={scene.motionDirection} onChange={(e) => updateScene(scene.id, { motionDirection: e.target.value })} placeholder="Motion direction" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white" />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <GlassButton variant="ghost">Edit</GlassButton>
                        <GlassButton variant="ghost" onClick={() => updateScene(scene.id, { visualDirection: `${scene.visualDirection || "Regenerated visual direction"} (regen)` })}>Regenerate</GlassButton>
                        <GlassButton variant="ghost" onClick={() => duplicateScene(scene.id)}>Duplicate</GlassButton>
                        <GlassButton variant="ghost" onClick={() => setStoryboardScenes((current) => current.filter((item) => item.id !== scene.id).map((item, index) => ({ ...item, sceneNumber: index + 1 })))}>Remove</GlassButton>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              ) : null}
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

            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>4. Timeline Preview</div>
              <div className={cx("text-sm", glassTheme.text.secondary)}>Timeline preview generated from storyboard (not a full editor).</div>
              <div className={cx("text-xs", glassTheme.text.secondary)}>{storyboardScenes.length} scenes • {totalStoryboardDuration}s total</div>
              <div className="flex flex-wrap gap-2 text-xs text-white/75">
                {storyboardScenes.map((scene) => <span key={scene.id} className="rounded-full border border-white/15 px-2 py-1">S{scene.sceneNumber}: {scene.durationSeconds}s</span>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <GlassButton variant="secondary">Open timeline editor</GlassButton>
                <GlassButton variant="primary" onClick={() => void submitJob()} disabled={submitting || serviceUnavailable}>Render from storyboard</GlassButton>
              </div>
            </section>

            <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-4" open={showAdvancedSettings} onToggle={(e) => setShowAdvancedSettings((e.target as HTMLDetailsElement).open)}>
              <summary className={cx("cursor-pointer text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Advanced settings (Provider / Render / Debug)</summary>
              <div className="mt-3 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
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
                        {formatLabel(item)} — {VIDEO_CREATION_STYLE_DESCRIPTIONS[item]}
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
                <GlassButton variant="primary" onClick={() => void submitJob()} disabled={submitting || serviceUnavailable}>
                  {serviceUnavailable ? "Service unavailable" : submitting ? "Creating..." : jobType === "series" ? "Create series" : "Create media job"}
                </GlassButton>
              </div>

                {message ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div> : null}
                {error ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div> : null}
              </div>
              </div>
            </details>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>5. Voice / Captions / Music</div>
              <div className={cx("text-xs", glassTheme.text.secondary)}>Captions are generated downstream after render; voice and music here are creative direction only.</div>
            </section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>6. Render Settings</div><div className={cx("text-sm", glassTheme.text.secondary)}>Provider, style, visual mode, aspect ratio, and duration configured in Advanced settings.</div></section>

            <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>7. Quality Checklist</div><ul className={cx("list-disc pl-5 text-sm", glassTheme.text.secondary)}><li>Prompt is specific and outcome-based.</li><li>Asset selection matches intended story.</li><li>Voice/music direction aligns with brand.</li><li>Render provider is configured.</li></ul></section>
          </div>

          <aside className="space-y-4">
            <GlassCard label="Readiness" title="Render readiness" description={renderReady ? "Ready to render." : "Resolve missing items before render."}>
              <div className="space-y-2 text-sm">
                <div className={cx(renderReady ? glassTheme.text.copperSoft : glassTheme.text.secondary)}>{renderReady ? "All core inputs are present." : "Missing:"}</div>
                {!renderReady ? <ul className="list-disc pl-5 text-white/80">{readinessMissing.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                <div className={cx("mt-3 text-xs", glassTheme.text.muted)}>Service status: {serviceUnavailable ? "Disconnected" : "Connected"}.</div>
                {!renderReady ? <GlassButton variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Go to missing inputs</GlassButton> : null}
              </div>
            </GlassCard>
          </aside>
        </div>
      </GlassCard>


      <GlassCard
        label="Voice / Captions / Music"
        title="Voiceover and music direction"
        description="ShopReel uses this as creative direction. Use licensed/user-owned music later; for now this guides mood, tempo, and voice."
        strong
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">Voiceover</span>
            <select
              value={voiceoverMode}
              onChange={(event) => setVoiceoverMode(event.target.value as VideoVoiceoverMode)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            >
              {VIDEO_VOICEOVER_MODES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">Music mood</span>
            <select
              value={musicDirection}
              onChange={(event) => setMusicDirection(event.target.value as VideoMusicDirection)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            >
              {VIDEO_MUSIC_DIRECTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">Duration</span>
            <div className="grid grid-cols-4 gap-2">
              {VIDEO_CREATION_DURATIONS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setDurationSeconds(seconds)}
                  className={cx(
                    "rounded-xl border px-3 py-2 text-sm transition",
                    durationSeconds === seconds
                      ? "border-cyan-300/35 bg-cyan-400/15 text-white"
                      : "border-white/10 bg-black/25 text-white/70 hover:bg-white/[0.06]"
                  )}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </label>
        </div>

        {musicDirection === "custom" ? (
          <input
            value={customMusicDirection}
            onChange={(event) => setCustomMusicDirection(event.target.value)}
            placeholder="Describe the music mood, tempo, or reference style. Do not use copyrighted track names unless you own/license them."
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          />
        ) : null}

        <textarea
          value={voiceoverScript}
          onChange={(event) => setVoiceoverScript(event.target.value)}
          placeholder="Optional voiceover direction or draft script. Example: Calm founder voice explaining the problem, then clear CTA."
          rows={3}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
        />
      </GlassCard>

      <GlassCard
        label="8. Recent Jobs / Variants"
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

                    <GlassButton
                      variant="ghost"
                      onClick={() => void deleteSeries(group.key)}
                      disabled={deletingSeriesKey === group.key}
                    >
                      {deletingSeriesKey === group.key ? "Deleting..." : "Delete series"}
                    </GlassButton>

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
                      (job) =>
                        job.provider === "openai" &&
                        job.job_type === "video" &&
                        job.status === "processing"
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
                      <div className={cx("text-xs", glassTheme.text.muted)}>Source: {sourceLabelForJob(job)}</div>
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
                      <GlassButton
                        variant="ghost"
                        onClick={() => void deleteJob(job.id)}
                        disabled={deletingJobId === job.id}
                      >
                        {deletingJobId === job.id ? "Deleting..." : "Delete"}
                      </GlassButton>

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
