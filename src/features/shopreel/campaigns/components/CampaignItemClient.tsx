"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import {
  VIDEO_CREATION_ASPECT_RATIOS,
  VIDEO_CREATION_STYLES,
  VIDEO_CREATION_VISUAL_MODES,
  formatLabel,
  type VideoCreationAspectRatio,
  type VideoCreationStyle,
  type VideoCreationVisualMode,
} from "@/features/shopreel/video-creation/lib/types";

type SceneRow = {
  id: string;
  title: string;
  prompt: string;
  status: string;
  scene_order: number;
  duration_seconds: number | null;
  media_job_id: string | null;
  output_asset_id?: string | null;
  metadata?: unknown;
  media_job?: {
    id: string;
    status: string;
    output_asset_id: string | null;
    preview_url: string | null;
    error_text?: string | null;
  } | null;
  frame_job?: {
    id: string;
    status: string;
    preview_url: string | null;
    provider?: string | null;
    provider_job_id?: string | null;
    error_text?: string | null;
  } | null;
};

type ItemRow = {
  id: string;
  campaign_id: string;
  title: string;
  angle: string;
  prompt: string;
  status: string;
  aspect_ratio: string;
  style: string | null;
  visual_mode: string | null;
  media_job_id: string | null;
  content_piece_id: string | null;
  metadata?: unknown;
  final_output_asset_id?: string | null;
  duration_seconds?: number | null;
};

type CreativeProfile = {
  style: VideoCreationStyle;
  visualMode: VideoCreationVisualMode;
  aspectRatio: VideoCreationAspectRatio;
  durationSeconds: number;
  cameraStyle: string;
  lighting: string;
  energy: string;
};

const CAMERA_STYLE_OPTIONS = [
  "handheld_close",
  "static_clean",
  "slow_push_in",
  "tracking_motion",
  "mixed_social",
] as const;

const LIGHTING_OPTIONS = [
  "soft_natural",
  "bright_clean",
  "high_contrast",
  "moody_premium",
  "studio_polished",
] as const;

const ENERGY_OPTIONS = [
  "confident_modern",
  "fast_social",
  "premium_calm",
  "bold_direct",
  "relatable_casual",
] as const;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getCreativeProfile(item: ItemRow): CreativeProfile {
  const metadata = asObject(item.metadata);
  const creative = asObject(metadata.creative_profile);

  return {
    style:
      (typeof creative.style === "string" ? creative.style : item.style ?? "cinematic") as VideoCreationStyle,
    visualMode:
      (typeof creative.visualMode === "string" ? creative.visualMode : item.visual_mode ?? "photoreal") as VideoCreationVisualMode,
    aspectRatio:
      (typeof creative.aspectRatio === "string" ? creative.aspectRatio : item.aspect_ratio ?? "9:16") as VideoCreationAspectRatio,
    durationSeconds:
      typeof creative.durationSeconds === "number"
        ? creative.durationSeconds
        : Number(item.duration_seconds ?? 8),
    cameraStyle:
      typeof creative.cameraStyle === "string" ? creative.cameraStyle : "handheld_close",
    lighting:
      typeof creative.lighting === "string" ? creative.lighting : "soft_natural",
    energy:
      typeof creative.energy === "string" ? creative.energy : "confident_modern",
  };
}



type SceneDirection = {
  emotionalBeat: string;
  hook: string;
  pacing: string;
  cameraMotion: string;
  framing: string;
  lightingMood: string;
  overlayText: string;
  narrationTone: string;
  transitionStyle: string;
  platformPacing: { tiktok: string; reels: string; shorts: string };
  durationEstimate: string;
  emotionalArcPosition: string;
  sceneEnergy: string;
  emotionalIntensity: string;
  visualDirectionBlocks: string[];
};

type PlatformPreviewMode = "tiktok" | "reels" | "shorts";
type RefinementAction =
  | "stronger_hook"
  | "more_emotional"
  | "quieter_tone"
  | "more_cinematic"
  | "more_documentary"
  | "simplify_narration"
  | "reduce_ai_feel"
  | "increase_realism";

const PLATFORM_LABELS: Record<PlatformPreviewMode, string> = {
  tiktok: "TikTok",
  reels: "Reels",
  shorts: "Shorts",
};

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function firstSentence(value: string, fallback: string) {
  const part = value.split(/(?<=[.!?])\s+/)[0]?.trim();
  return part && part.length > 0 ? part : fallback;
}

function getSceneDirection(scene: SceneRow): SceneDirection {
  const sceneMetadata = asObject(scene.metadata);
  const storyboard = asObject(sceneMetadata.storyboard);
  const visualNarrative = asObject(sceneMetadata.visual_narrative);
  const platform = asObject(storyboard.platformAdaptation);
  const emotional = asObject(sceneMetadata.emotional_realism);

  const fallbackEmotionalBeat = firstSentence(scene.prompt, "Grounded emotional turning point");
  const fallbackHook = firstSentence(scene.prompt, "Open on a precise human moment.");
  const arcPosition = typeof sceneMetadata.emotional_arc_stage === "string"
    ? sceneMetadata.emotional_arc_stage
    : typeof sceneMetadata.arc_stage === "string"
      ? sceneMetadata.arc_stage
      : "progression";

  return {
    emotionalBeat: typeof sceneMetadata.emotional_beat === "string" ? sceneMetadata.emotional_beat : fallbackEmotionalBeat,
    hook: typeof storyboard.hook === "string" ? storyboard.hook : fallbackHook,
    pacing: typeof storyboard.pacing === "string" ? storyboard.pacing : "fast cuts -> intentional pause -> emotional release",
    cameraMotion:
      typeof visualNarrative.cameraMovement === "string"
        ? visualNarrative.cameraMovement
        : typeof storyboard.cameraFeel === "string"
          ? storyboard.cameraFeel
          : "static handheld with a slow push-in",
    framing:
      typeof visualNarrative.framing === "string"
        ? visualNarrative.framing
        : "tight subject framing with contextual environment",
    lightingMood:
      typeof visualNarrative.lightingMood === "string"
        ? visualNarrative.lightingMood
        : "cold-to-warm practical lighting transition",
    overlayText: typeof storyboard.textOverlayStyle === "string" ? storyboard.textOverlayStyle : "minimal sentence overlays with emotional specificity",
    narrationTone: typeof storyboard.tone === "string" ? storyboard.tone : "calm, empathetic, precise",
    transitionStyle:
      typeof storyboard.transitionStyle === "string"
        ? storyboard.transitionStyle
        : typeof visualNarrative.transitionEnergy === "string"
          ? visualNarrative.transitionEnergy
          : "movement-led transitions",
    platformPacing: {
      tiktok: typeof platform.tiktok === "string" ? platform.tiktok : "fast emotional cuts",
      reels: typeof platform.reels === "string" ? platform.reels : "emotional hold before payoff",
      shorts: typeof platform.shorts === "string" ? platform.shorts : "text-led educational rhythm",
    },
    durationEstimate: scene.duration_seconds ? `${scene.duration_seconds}s` : "~6-10s",
    emotionalArcPosition: toTitleCase(arcPosition),
    sceneEnergy: typeof sceneMetadata.scene_energy === "string" ? sceneMetadata.scene_energy : "Measured escalation",
    emotionalIntensity: typeof emotional.realismScore === "number" ? `${Math.round(emotional.realismScore)} / 100` : "Balanced",
    visualDirectionBlocks: [
      "static handheld",
      "slow push-in",
      "shallow depth",
      "warm lighting transition",
      "ambient room tone",
      "low-frequency cinematic music",
    ],
  };
}

function displayStatus(scene: SceneRow) {
  if (scene.media_job?.status) return scene.media_job.status;
  if (scene.media_job_id && scene.status === "draft") return "linked";
  return scene.status;
}

function getNextAction(args: {
  totalScenes: number;
  linkedScenes: number;
  queuedScenes: number;
  processingScenes: number;
  completedScenes: number;
  failedScenes: number;
  finalOutputReady: boolean;
}) {
  if (args.finalOutputReady) {
    return {
      action: "ready" as const,
      label: "Final video ready",
      description: "This campaign video is ready.",
    };
  }

  if (
    args.processingScenes > 0 ||
    args.queuedScenes > 0 ||
    args.completedScenes > 0
  ) {
    return {
      action: "check_progress" as const,
      label: "Check progress",
      description: "Refresh active scene jobs and assemble the final video when ready.",
    };
  }

  if (args.totalScenes > 0 || args.linkedScenes > 0) {
    return {
      action: "create_videos" as const,
      label: "Generate video clips",
      description: "Use the approved/static scene references to start video clip generation.",
    };
  }

  return {
    action: "build_scenes" as const,
    label: "Build scenes",
    description: "Prepare the scenes for this campaign video.",
  };
}

function getDominantFrameCta(scenes: SceneRow[]) {
  const sceneWithFrame = scenes.find((scene) => scene.frame_job?.status === "completed" || scene.frame_job?.preview_url);
  if (sceneWithFrame) {
    return {
      label: "Generate reference frames",
      description: "Build static visual references across the storyboard before clip/video generation.",
      targetSceneId: null as string | null,
    };
  }
  return {
    label: "Generate first reference frame",
    description: "Create the first static reference image so FAL/image generation has a clear visual target before Kling/video generation.",
    targetSceneId: scenes[0]?.id ?? null,
  };
}

export default function CampaignItemClient({
  item,
  scenes,
}: {
  item: ItemRow;
  scenes: SceneRow[];
}) {
  const router = useRouter();
  const initialCreative = getCreativeProfile(item);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [style, setStyle] = useState<VideoCreationStyle>(initialCreative.style);
  const [visualMode, setVisualMode] = useState<VideoCreationVisualMode>(initialCreative.visualMode);
  const [aspectRatio, setAspectRatio] = useState<VideoCreationAspectRatio>(initialCreative.aspectRatio);
  const [durationSeconds, setDurationSeconds] = useState<number>(initialCreative.durationSeconds);
  const [cameraStyle, setCameraStyle] = useState<string>(initialCreative.cameraStyle);
  const [lighting, setLighting] = useState<string>(initialCreative.lighting);
  const [energy, setEnergy] = useState<string>(initialCreative.energy);

  async function handleResetItem() {
    const confirmed = window.confirm(
      "Reset this item and clear all linked scene jobs?"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/shopreel/campaigns/items/${item.id}/reset`, {
      method: "POST",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      window.alert(json?.error ?? "Failed to reset item");
      return;
    }

    router.refresh();
  }

  async function handleDeleteItem() {
    const confirmed = window.confirm(
      "Delete this item and all related scenes and jobs?"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/shopreel/campaigns/items/${item.id}/delete`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      window.alert(json?.error ?? "Failed to delete item");
      return;
    }

    router.push(`/shopreel/campaigns/${item.campaign_id}`);
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


  async function generateSceneFrame(sceneId: string) {
    try {
      setBusy(`frame-${sceneId}`);
      setError(null);
      setStatusMessage("Generating static reference frame...");
      const res = await fetch(`/api/shopreel/campaigns/items/${item.id}/scene-frames/${sceneId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.error ?? "Failed to generate scene frame");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveCreativeProfile(rebuildMediaJobs = false) {
    try {
      setBusy(rebuildMediaJobs ? "save-rebuild-creative" : "save-creative");
      setError(null);
      setStatusMessage(
        rebuildMediaJobs
          ? "Saving creative direction and rebuilding scene jobs..."
          : "Saving creative direction and refreshing scenes..."
      );

      const res = await fetch(
        `/api/shopreel/campaigns/items/${item.id}/creative-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            style,
            visualMode,
            aspectRatio,
            durationSeconds,
            cameraStyle,
            lighting,
            energy,
            rebuildMediaJobs,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? "Failed to save creative direction");
      }

      setStatusMessage(
        rebuildMediaJobs
          ? "Creative direction saved and scene jobs rebuilt."
          : "Creative direction saved and scene prompts refreshed."
      );
      router.refresh();
      window.setTimeout(() => {
        setStatusMessage(null);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save creative direction");
    } finally {
      setBusy(null);
    }
  }

  const totalScenes = scenes.length;
  const completedScenes = scenes.filter(
    (scene) => displayStatus(scene) === "completed"
  ).length;
  const processingScenes = scenes.filter(
    (scene) => displayStatus(scene) === "processing"
  ).length;
  const queuedScenes = scenes.filter(
    (scene) => displayStatus(scene) === "queued"
  ).length;
  const linkedScenes = scenes.filter(
    (scene) => displayStatus(scene) === "linked"
  ).length;
  const failedScenes = scenes.filter(
    (scene) => displayStatus(scene) === "failed"
  ).length;

  const progressPercent =
    totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

  const nextAction = useMemo(
    () =>
      getNextAction({
        totalScenes,
        linkedScenes,
        queuedScenes,
        processingScenes,
        completedScenes,
        failedScenes,
        finalOutputReady: !!item.final_output_asset_id,
      }),
    [
      totalScenes,
      linkedScenes,
      queuedScenes,
      processingScenes,
      completedScenes,
      failedScenes,
      item.final_output_asset_id,
    ]
  );

  const anyBusy = busy !== null;
  const emotionalProgression = scenes.map((scene) => getSceneDirection(scene).emotionalBeat);
  const [platformPreview, setPlatformPreview] = useState<PlatformPreviewMode>("tiktok");
  const [workspaceSceneOrder, setWorkspaceSceneOrder] = useState<string[]>([]);
  const [collapsedScenes, setCollapsedScenes] = useState<Record<string, boolean>>({});
  const [selectedRefinements, setSelectedRefinements] = useState<RefinementAction[]>([]);
  const [referenceFrameApproved, setReferenceFrameApproved] = useState(false);
  const [manualReferenceUrl, setManualReferenceUrl] = useState("");
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [sceneDeckCollapsed, setSceneDeckCollapsed] = useState(false);
  const [openInfoPanel, setOpenInfoPanel] = useState<"item" | "direction" | "workflow" | "reference" | null>("workflow");

  useEffect(() => {
    setWorkspaceSceneOrder(scenes.map((scene) => scene.id));
  }, [scenes]);

  const orderedScenes = useMemo(() => {
    const map = new Map(scenes.map((scene) => [scene.id, scene]));
    const ordered = workspaceSceneOrder
      .map((id) => map.get(id))
      .filter((scene): scene is SceneRow => !!scene);
    const missing = scenes.filter((scene) => !workspaceSceneOrder.includes(scene.id));
    return [...ordered, ...missing];
  }, [scenes, workspaceSceneOrder]);
  const dominantFrameCta = useMemo(() => getDominantFrameCta(orderedScenes), [orderedScenes]);

  const selectedScene = orderedScenes[selectedSceneIndex] ?? orderedScenes[0] ?? null;
  const selectedSceneStatus = selectedScene ? displayStatus(selectedScene) : "not_started";
  const selectedSceneDirection = selectedScene ? getSceneDirection(selectedScene) : null;

  function goToScene(offset: -1 | 1) {
    setSelectedSceneIndex((current) => {
      if (orderedScenes.length === 0) return 0;
      const next = current + offset;
      if (next < 0) return orderedScenes.length - 1;
      if (next >= orderedScenes.length) return 0;
      return next;
    });
  }

  function selectSceneById(sceneId: string) {
    const index = orderedScenes.findIndex((scene) => scene.id === sceneId);
    if (index >= 0) setSelectedSceneIndex(index);
  }

  const frameJobs = orderedScenes
    .map((scene) => scene.frame_job)
    .filter((job): job is NonNullable<SceneRow["frame_job"]> => Boolean(job));

  const completedFrameJobs = frameJobs.filter((job) => job.status === "completed" || Boolean(job.preview_url));
  const processingFrameJobs = frameJobs.filter((job) => /queued|processing|running|pending/i.test(job.status ?? ""));
  const firstFramePreviewUrl = completedFrameJobs.find((job) => job.preview_url)?.preview_url ?? null;
  const failedFrameJobs = firstFramePreviewUrl
    ? []
    : frameJobs.filter((job) => /failed|error/i.test(job.status ?? ""));

  const mediaJobs = orderedScenes
    .map((scene) => scene.media_job)
    .filter((job): job is NonNullable<SceneRow["media_job"]> => Boolean(job));
  const completedVideoJobs = mediaJobs.filter((job) => job.status === "completed" || Boolean(job.preview_url));
  const activeVideoJobs = mediaJobs.filter((job) => /queued|submitted|processing|rendering|running|pending/i.test(job.status ?? ""));
  const failedVideoJobs = mediaJobs.filter((job) => /failed|error/i.test(job.status ?? ""));
  const readyForVideoScenes = orderedScenes.filter((scene) => Boolean(scene.frame_job?.preview_url) && !scene.media_job?.preview_url);
  const missingReferenceScenes = orderedScenes.filter((scene) => !scene.frame_job?.preview_url);

  const approvedReferenceUrl = manualReferenceUrl.trim() || firstFramePreviewUrl;
  const hasReferenceFrame = Boolean(approvedReferenceUrl);
  const canGenerateReferenceFrame = Boolean(dominantFrameCta.targetSceneId) && !anyBusy;
  const needsScenesBeforeFrames = orderedScenes.length === 0;
  const canGenerateVideoClips = hasReferenceFrame && referenceFrameApproved && !anyBusy;
  const operatorPrimaryLabel = needsScenesBeforeFrames
    ? "Build scenes first"
    : processingFrameJobs.length > 0
      ? "Reference frame running..."
      : completedFrameJobs.length > 0
        ? "Generate another reference frame"
        : "Generate reference frame →";

  function moveScene(sceneId: string, direction: -1 | 1) {
    setWorkspaceSceneOrder((current) => {
      const index = current.indexOf(sceneId);
      if (index < 0) return current;
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [entry] = next.splice(index, 1);
      next.splice(target, 0, entry);
      return next;
    });
  }

  return (
    <div className="grid gap-5">
      <section className="overflow-hidden rounded-[1.35rem] border border-cyan-200/20 bg-[#06111f]/85 px-5 py-4 shadow-[0_12px_34px_rgba(0,0,0,.24)] backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-100/75">Operator next step</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white">
              {needsScenesBeforeFrames
                ? "Build storyboard scenes first"
                : referenceFrameApproved
                  ? "Reference frame approved"
                  : hasReferenceFrame
                    ? "Review and approve the reference frame"
                    : "Generate the first static reference frame"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/68">
              {needsScenesBeforeFrames
                ? "No storyboard scenes exist yet. Build scenes first, then the operator can create static reference frames."
                : referenceFrameApproved
                  ? "The reference image is approved. The next step is generating video clips from the approved visual target."
                  : hasReferenceFrame
                    ? "A static reference image is ready. Approve it, regenerate it, or upload your own replacement before video generation."
                    : "Campaign direction is ready. The operator needs a static reference image before video clip generation so the downstream pipeline has a clear visual target."}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a href="#creative-direction" className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/78 transition hover:bg-white/[0.08]">
              Edit direction
            </a>
            {needsScenesBeforeFrames ? (
              <button
                type="button"
                onClick={() =>
                  void runAction(
                    "create-scenes",
                    `/api/shopreel/campaigns/items/${item.id}/create-scene-jobs`,
                    "Building storyboard scenes before reference-frame generation..."
                  )
                }
                disabled={anyBusy}
                className="rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,.22)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "create-scenes" ? "Building scenes..." : "Build scenes first →"}
              </button>
            ) : referenceFrameApproved ? (
              <button
                type="button"
                onClick={() =>
                  void runAction(
                    "run-scenes",
                    `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`,
                    "Starting video clip generation from the approved reference frame..."
                  )
                }
                disabled={!canGenerateVideoClips}
                className="rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,.22)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "run-scenes" ? "Generating clips..." : "Generate video clips →"}
              </button>
            ) : hasReferenceFrame ? (
              <button
                type="button"
                onClick={() => setReferenceFrameApproved(true)}
                disabled={anyBusy}
                className="rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,.22)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve reference frame →
              </button>
            ) : dominantFrameCta.targetSceneId ? (
              <button
                type="button"
                onClick={() => void generateSceneFrame(dominantFrameCta.targetSceneId!)}
                disabled={!canGenerateReferenceFrame}
                className="rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,.22)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === `frame-${dominantFrameCta.targetSceneId}` ? "Generating..." : operatorPrimaryLabel}
              </button>
            ) : (
              <a href="#reference-frame-preview" className="rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,.22)]">
                Review reference frames →
              </a>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45 sm:grid-cols-5">
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-white/70">Campaign</span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-white/70">Direction</span>
          <span className={`rounded-full border px-3 py-2 ${hasReferenceFrame ? "border-emerald-200/30 bg-emerald-300/10 text-emerald-100" : "border-cyan-200/30 bg-cyan-300/10 text-cyan-100"}`}>Reference frame</span>
          <span className={`rounded-full border px-3 py-2 ${referenceFrameApproved ? "border-cyan-200/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.035] text-white/55"}`}>Video clip</span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-white/55">Review / post</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Reference frames</div>
            <div className="mt-1 text-lg font-semibold text-white">{completedFrameJobs.length}/{totalScenes}</div>
            <div className="text-xs text-white/55">{missingReferenceScenes.length} missing</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Video clips</div>
            <div className="mt-1 text-lg font-semibold text-white">{completedVideoJobs.length}/{totalScenes}</div>
            <div className="text-xs text-white/55">{activeVideoJobs.length} active · {failedVideoJobs.length} failed</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Ready for Kling</div>
            <div className="mt-1 text-lg font-semibold text-white">{readyForVideoScenes.length}</div>
            <div className="text-xs text-white/55">Scenes with frame target</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Provider</div>
            <div className="mt-1 text-lg font-semibold text-white">FAL</div>
            <div className="text-xs text-white/55">Kling image-to-video</div>
          </div>
        </div>

        {statusMessage || error || processingFrameJobs.length > 0 || failedFrameJobs.length > 0 || firstFramePreviewUrl ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              {firstFramePreviewUrl ? (
                <p className="text-emerald-100/80">{completedFrameJobs.length} reference frame{completedFrameJobs.length === 1 ? "" : "s"} ready.</p>
              ) : statusMessage ? (
                <p className="text-cyan-100/80">{statusMessage}</p>
              ) : null}
              {!firstFramePreviewUrl && processingFrameJobs.length > 0 ? <p className="text-cyan-100/80">Reference frame job is running. Refresh or wait for the preview to appear.</p> : null}
              {!firstFramePreviewUrl && failedFrameJobs.length > 0 ? <p className="text-rose-200">{failedFrameJobs.length} reference frame job{failedFrameJobs.length === 1 ? "" : "s"} failed. Regenerate from the scene card.</p> : null}
              {error ? <p className="text-rose-200">{error}</p> : null}
            </div>
            {firstFramePreviewUrl ? (
              <a href={approvedReferenceUrl || firstFramePreviewUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-cyan-200/20 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={approvedReferenceUrl || firstFramePreviewUrl} alt="Generated reference frame preview" className="h-24 w-16 object-cover" />
              </a>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="grid gap-3">
          {[
            {
              id: "workflow" as const,
              label: "Workflow",
              title: "Production state",
              body: `${completedFrameJobs.length}/${totalScenes} reference frames · ${completedVideoJobs.length}/${totalScenes} video clips · ${readyForVideoScenes.length} ready for Kling`,
            },
            {
              id: "item" as const,
              label: "Item",
              title: item.title,
              body: item.prompt,
            },
            {
              id: "direction" as const,
              label: "Direction",
              title: "Creative controls",
              body: `${formatLabel(style)} · ${formatLabel(visualMode)} · ${aspectRatio} · ${durationSeconds}s`,
            },
            {
              id: "reference" as const,
              label: "Reference",
              title: "Frame handoff",
              body: hasReferenceFrame
                ? "Reference frame exists. Generate video clips only for scenes with a frame target."
                : "Generate a reference frame before Kling image-to-video.",
            },
          ].map((panel) => (
            <button
              key={panel.id}
              type="button"
              onClick={() => setOpenInfoPanel(openInfoPanel === panel.id ? null : panel.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                openInfoPanel === panel.id
                  ? "border-cyan-200/35 bg-cyan-500/10"
                  : "border-white/10 bg-white/[0.035] hover:bg-white/[0.055]"
              }`}
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">{panel.label}</div>
              <div className="mt-1 text-base font-semibold text-white">{panel.title}</div>
              {openInfoPanel === panel.id ? (
                <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/15 p-3 text-sm leading-6 text-white/70">
                  {panel.body}
                </div>
              ) : (
                <div className="mt-2 line-clamp-2 text-sm text-white/55">{panel.body}</div>
              )}
            </button>
          ))}
        </div>

        <aside className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Scene deck</div>
              <div className="text-sm text-white/65">
                {orderedScenes.length > 0 ? `${selectedSceneIndex + 1}/${orderedScenes.length}` : "No scenes"}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goToScene(-1)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goToScene(1)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => setSceneDeckCollapsed((value) => !value)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80"
              >
                {sceneDeckCollapsed ? "Expand" : "Collapse"}
              </button>
            </div>
          </div>

          {!sceneDeckCollapsed && selectedScene ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/65">
                  {`Shot ${selectedSceneIndex + 1}`}
                </div>
                <div className="mt-1 text-lg font-semibold text-white">{selectedScene.title}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <GlassBadge tone="default">{selectedSceneStatus}</GlassBadge>
                  <GlassBadge tone="muted">Frame: {selectedScene.frame_job?.status ?? "not_started"}</GlassBadge>
                  {selectedScene.media_job?.status ? <GlassBadge tone="muted">Video: {selectedScene.media_job.status}</GlassBadge> : null}
                  {selectedScene.media_job?.preview_url ? <GlassBadge tone="copper">Clip ready</GlassBadge> : null}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">Reference image</div>
                  {selectedScene.frame_job?.preview_url ? (
                    <img
                      src={selectedScene.frame_job.preview_url}
                      alt={`${selectedScene.title} reference frame`}
                      className="aspect-[9/16] w-full rounded-xl border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[9/16] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center text-sm text-white/55">
                      Generate reference image first.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">Generated video</div>
                  {selectedScene.media_job?.preview_url ? (
                    <video
                      src={selectedScene.media_job.preview_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="aspect-[9/16] w-full rounded-xl border border-white/10 bg-black object-contain"
                    />
                  ) : (
                    <div className="flex aspect-[9/16] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center text-sm text-white/55">
                      {selectedScene.frame_job?.preview_url
                        ? "Reference frame ready. Generate video next."
                        : "Video locked until reference image exists."}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <GlassButton
                  variant="secondary"
                  disabled={anyBusy}
                  onClick={() => void generateSceneFrame(selectedScene.id)}
                >
                  {selectedScene.frame_job ? "Regenerate reference image" : "Generate reference image"}
                </GlassButton>

                <GlassButton
                  variant="primary"
                  disabled={anyBusy || !selectedScene.frame_job?.preview_url}
                  onClick={() =>
                    void runAction(
                      "run-scenes",
                      `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`,
                      "Generating video clips for scenes with reference frames..."
                    )
                  }
                >
                  Generate video
                </GlassButton>
              </div>

              {selectedSceneDirection ? (
                <details className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-sm text-white/65">
                  <summary className="cursor-pointer text-white/80">Scene direction</summary>
                  <div className="mt-3 space-y-2">
                    <p>{selectedSceneDirection.emotionalBeat}</p>
                    <p>Camera: {selectedSceneDirection.cameraMotion}</p>
                    <p>Lighting: {selectedSceneDirection.lightingMood}</p>
                    <p>Pacing: {selectedSceneDirection.pacing}</p>
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-4 gap-2">
            {orderedScenes.map((scene, index) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => selectSceneById(scene.id)}
                className={`h-2 rounded-full ${
                  index === selectedSceneIndex
                    ? "bg-cyan-200"
                    : scene.media_job?.preview_url
                      ? "bg-emerald-300/80"
                      : scene.frame_job?.preview_url
                        ? "bg-violet-300/80"
                        : "bg-white/20"
                }`}
                aria-label={`Select scene ${index + 1}`}
              />
            ))}
          </div>
        </aside>
      </section>

      <GlassCard label="Item" title={item.title} description="Campaign item summary and production settings." strong>
        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{item.status}</GlassBadge>
          <GlassBadge tone="muted">{item.angle}</GlassBadge>
          <GlassBadge tone="muted">{aspectRatio}</GlassBadge>
          <GlassBadge tone="muted">{formatLabel(style)}</GlassBadge>
          <GlassBadge tone="muted">{formatLabel(visualMode)}</GlassBadge>
          <GlassBadge tone="muted">{durationSeconds}s</GlassBadge>
          {completedVideoJobs.length > 0 ? (
            <GlassBadge tone="copper">{completedVideoJobs.length} clip ready</GlassBadge>
          ) : null}
          {item.final_output_asset_id ? (
            <GlassBadge tone="copper">Final video ready</GlassBadge>
          ) : null}
        </div>
        <details className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-3 text-sm text-white/68">
          <summary className="cursor-pointer text-white/80">View full campaign prompt</summary>
          <p className="mt-3 leading-6">{item.prompt}</p>
        </details>
      </GlassCard>

      <section id="creative-direction" className="scroll-mt-56">
        <GlassCard
        label="Creative Direction"
        title="Lock the campaign look"
        description="Choose the visual direction once, then keep all scenes inside the same creative world."
        strong
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
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
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
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
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
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

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Duration (seconds)
            </span>
            <input
              type="number"
              min={3}
              max={20}
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(Number(e.target.value))}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Camera style
            </span>
            <select
              value={cameraStyle}
              onChange={(e) => setCameraStyle(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            >
              {CAMERA_STYLE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Lighting
            </span>
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            >
              {LIGHTING_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 md:col-span-2 xl:col-span-1">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Energy / pacing
            </span>
            <select
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            >
              {ENERGY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <GlassButton
            variant="secondary"
            onClick={() => void saveCreativeProfile(false)}
            disabled={anyBusy}
          >
            {busy === "save-creative" ? "Saving..." : "Save creative direction"}
          </GlassButton>

          <GlassButton
            variant="primary"
            onClick={() => void saveCreativeProfile(true)}
            disabled={anyBusy}
          >
            {busy === "save-rebuild-creative"
              ? "Working..."
              : "Save + rebuild scene jobs"}
          </GlassButton>
        </div>

        <div className="mt-3 text-sm text-white/60">
          These settings are user-controlled and will be applied across all scenes
          so the full campaign feels cohesive.
        </div>
      </GlassCard>
      </section>

      <GlassCard label="Workflow" title="Creator Production Flow" description="Review the campaign story, generate static reference frames, then move into video clips and final output." strong>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/75">
            {["Review Campaign", "Generate Reference Frames", "Generate Video Clips", "Review Output", "Export / Publish"].map((step, index, arr) => (
              <div key={step} className="inline-flex items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1">{step}</span>
                {index < arr.length - 1 ? <span className="text-white/35">→</span> : null}
              </div>
            ))}
          </div>
          <div className="text-3xl font-semibold text-white">{progressPercent}%</div>
          <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300/80 via-blue-400/80 to-emerald-300/80 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-white/70">
            <span>{completedScenes} completed</span>
            <span>•</span>
            <span>{processingScenes} processing</span>
            <span>•</span>
            <span>{queuedScenes} queued</span>
            <span>•</span>
            <span>{linkedScenes} linked</span>
            {failedScenes > 0 ? (
              <>
                <span>•</span>
                <span className="text-red-300">{failedScenes} failed</span>
              </>
            ) : null}
            <span>•</span>
            <span>{totalScenes} total scenes</span>
          </div>
        </div>
      </GlassCard>

      <section id="reference-frame-preview" className="scroll-mt-56" />
      <section id="reference-frame-generation" className="scroll-mt-56">
      <GlassCard
        label="Primary Action"
        title={needsScenesBeforeFrames ? "Build storyboard scenes" : dominantFrameCta.label}
        description={
          needsScenesBeforeFrames
            ? "Create the scene plan first. Reference images require at least one storyboard scene."
            : dominantFrameCta.description
        }
        strong
      >
        <div className="space-y-4">
          {statusMessage ? (
            <div className="text-sm text-white/60">{statusMessage}</div>
          ) : null}

          {firstFramePreviewUrl ? (
            <div className="grid gap-4 rounded-2xl border border-cyan-200/20 bg-black/20 p-4 md:grid-cols-[12rem_minmax(0,1fr)]">
              <a href={approvedReferenceUrl || firstFramePreviewUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={approvedReferenceUrl || firstFramePreviewUrl} alt="Generated reference frame preview" className="aspect-[9/16] w-full object-cover" />
              </a>
              <div className="flex flex-col justify-center">
                <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/60">Reference frame ready</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Review the generated still</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  This is the static image target for the next video step. Approve it, regenerate it, or paste an uploaded image URL to use your own reference.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReferenceFrameApproved(true)}
                    disabled={anyBusy || referenceFrameApproved}
                    className="rounded-xl bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-200/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {referenceFrameApproved ? "Approved" : "Approve reference"}
                  </button>
                  {dominantFrameCta.targetSceneId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReferenceFrameApproved(false);
                        void generateSceneFrame(dominantFrameCta.targetSceneId!);
                      }}
                      disabled={anyBusy}
                      className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Regenerate
                    </button>
                  ) : null}
                </div>
                <label className="mt-4 grid gap-2 text-sm text-white/70">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">Manual reference image URL</span>
                  <input
                    value={manualReferenceUrl}
                    onChange={(event) => {
                      setManualReferenceUrl(event.target.value);
                      setReferenceFrameApproved(false);
                    }}
                    placeholder="Paste uploaded image URL"
                    className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-cyan-200/40"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {hasReferenceFrame && !referenceFrameApproved ? (
            <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4 text-sm text-amber-50">
              Review and approve the reference frame before generating video clips.
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {needsScenesBeforeFrames ? (
              <GlassButton
                variant="primary"
                onClick={() =>
                  void runAction(
                    "create-scenes",
                    `/api/shopreel/campaigns/items/${item.id}/create-scene-jobs`,
                    "Building storyboard scenes before reference-frame generation..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "create-scenes" ? "Building scenes..." : "Build scenes"}
              </GlassButton>
            ) : dominantFrameCta.targetSceneId ? (
              (() => {
                const targetSceneId = dominantFrameCta.targetSceneId;
                return (
              <GlassButton
                variant="primary"
                onClick={() => void generateSceneFrame(targetSceneId)}
                disabled={anyBusy}
              >
                {busy === `frame-${targetSceneId}` ? "Working..." : dominantFrameCta.label}
              </GlassButton>
                );
              })()
            ) : (
              <GlassButton
                variant="primary"
                onClick={() =>
                  void Promise.all(orderedScenes.map((scene) => generateSceneFrame(scene.id)))
                }
                disabled={anyBusy || orderedScenes.length === 0}
              >
                {busy?.startsWith("frame-") ? "Working..." : dominantFrameCta.label}
              </GlassButton>
            )}

            {nextAction.action === "build_scenes" ? (
              <GlassButton
                variant="secondary"
                onClick={() =>
                  void runAction(
                    "create-scenes",
                    `/api/shopreel/campaigns/items/${item.id}/create-scene-jobs`,
                    "Preparing scenes for this campaign video..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "create-scenes" ? "Working..." : "Build scenes"}
              </GlassButton>
            ) : null}

            {nextAction.action === "create_videos" ? (
              <GlassButton
                variant="secondary"
                onClick={() =>
                  void runAction(
                    "run-scenes",
                    `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`,
                    "Starting video clip generation from the scene references..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "run-scenes" ? "Working..." : "Generate video clips"}
              </GlassButton>
            ) : null}

            {nextAction.action === "check_progress" ? (
              <GlassButton
                variant="secondary"
                onClick={() =>
                  void runAction(
                    "sync-scenes",
                    `/api/shopreel/campaigns/items/${item.id}/sync-scene-jobs`,
                    "Checking scene progress..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "sync-scenes" ? "Working..." : "Check progress"}
              </GlassButton>
            ) : null}

            {nextAction.action === "ready" ? (
              <Link href={`/shopreel/campaigns/${item.campaign_id}`}>
                <GlassButton variant="primary">Back to campaign</GlassButton>
              </Link>
            ) : null}
          </div>

          {completedScenes === totalScenes && totalScenes > 0 && !item.final_output_asset_id ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/80">
                All scene videos are complete. You can now assemble the final video.
              </div>
              <div className="mt-3">
                <GlassButton
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "assemble",
                      `/api/shopreel/campaigns/items/${item.id}/assemble`,
                      "Assembling the final campaign video..."
                    )
                  }
                  disabled={anyBusy}
                >
                  {busy === "assemble" ? "Working..." : "Assemble final video"}
                </GlassButton>
              </div>
            </div>
          ) : null}

          <div>
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
                      "create-scenes",
                      `/api/shopreel/campaigns/items/${item.id}/create-scene-jobs`,
                      "Preparing scenes for this campaign video..."
                    )
                  }
                  disabled={anyBusy}
                >
                  {busy === "create-scenes" ? "Working..." : "Build scenes again"}
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "run-scenes",
                      `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`,
                      "Starting video clip generation from the scene references..."
                    )
                  }
                  disabled={anyBusy}
                >
                  {busy === "run-scenes" ? "Working..." : "Create videos again"}
                </GlassButton>

                <GlassButton
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "sync-scenes",
                      `/api/shopreel/campaigns/items/${item.id}/sync-scene-jobs`,
                      "Checking scene progress..."
                    )
                  }
                  disabled={anyBusy}
                >
                  {busy === "sync-scenes" ? "Working..." : "Check progress again"}
                </GlassButton>

                <GlassButton
                  variant="ghost"
                  onClick={handleResetItem}
                  disabled={anyBusy}
                >
                  Reset item
                </GlassButton>

                <GlassButton
                  variant="ghost"
                  onClick={handleDeleteItem}
                  disabled={anyBusy}
                >
                  Delete item
                </GlassButton>

                <Link href={`/shopreel/campaigns/${item.campaign_id}`}>
                  <GlassButton variant="ghost">Back to campaign</GlassButton>
                </Link>
              </div>
            ) : null}
          </div>

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
        </div>
      </GlassCard>



      <GlassCard label="Storyboard Arc" title="Emotional + Pacing Map" description="Follow the narrative progression so each scene feels like part of one cinematic story." strong>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-white/55">Emotional progression</div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
              {emotionalProgression.length === 0 ? "No scenes yet." : emotionalProgression.map((beat, index) => (
                <div key={`${beat}-${index}`} className="inline-flex items-center gap-2">
                  <span className="rounded-full border border-white/15 px-2 py-1">{beat}</span>
                  {index < emotionalProgression.length - 1 ? <span className="text-white/40">→</span> : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-white/55">Pacing visualization</div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-white/85">
              {["fast cuts", "silence beats", "slow emotional hold", "escalation", "release"].map((phase) => (
                <span key={phase} className="rounded-full border border-cyan-200/30 bg-cyan-500/10 px-3 py-1">{phase}</span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      </section>

      <GlassCard label="Storyboard Workspace" title="Scene sequencing board" description="Arrange scene order, shape story rhythm, and preview platform pacing with a creator-first lens." strong>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:col-span-2">
            <div className="text-xs uppercase tracking-[0.16em] text-white/55">Emotional timeline</div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/85">
              {orderedScenes.map((scene, index) => {
                const direction = getSceneDirection(scene);
                return (
                  <div key={`emotion-${scene.id}`} className="inline-flex items-center gap-2">
                    <span className="rounded-full border border-cyan-200/30 bg-cyan-500/10 px-3 py-1">{direction.emotionalBeat}</span>
                    {index < orderedScenes.length - 1 ? <span className="text-white/35">→</span> : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-white/60">
              Suggested flow: overwhelm → hesitation → reflection → support → momentum → calm.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-white/55">Platform preview</div>
            <div className="mt-3 grid gap-2">
              {(Object.keys(PLATFORM_LABELS) as PlatformPreviewMode[]).map((mode) => (
                <button key={mode} type="button" onClick={() => setPlatformPreview(mode)} className={`rounded-xl border px-3 py-2 text-left text-sm ${platformPreview === mode ? "border-cyan-300/40 bg-cyan-500/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-white/75"}`}>
                  {PLATFORM_LABELS[mode]}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/75">
              {platformPreview === "tiktok" ? "Fast cuts, aggressive hook timing, lean overlays, decisive transitions." : null}
              {platformPreview === "reels" ? "Emotional hold before payoff, softer overlay density, cinematic transitions." : null}
              {platformPreview === "shorts" ? "Text rhythm clarity, early learning hook, compressed transition style." : null}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard label="Creative Refinement" title="Creator tuning controls" description="Apply focused direction preferences while keeping orchestration details in the background." strong>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["stronger_hook", "Stronger hook"],
            ["more_emotional", "More emotional"],
            ["quieter_tone", "Quieter tone"],
            ["more_cinematic", "More cinematic"],
            ["more_documentary", "More documentary"],
            ["simplify_narration", "Simplify narration"],
            ["reduce_ai_feel", "Reduce AI-feel"],
            ["increase_realism", "Increase realism"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                setSelectedRefinements((current) =>
                  current.includes(key as RefinementAction)
                    ? current.filter((item) => item !== key)
                    : [...current, key as RefinementAction]
                )
              }
              className={`rounded-xl border px-3 py-2 text-left text-sm ${selectedRefinements.includes(key as RefinementAction) ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-black/20 text-white/80"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard label="Scenes" title="Storyboard Wall" description="Review each scene as a cinematic planning block, then generate frame references and clips." strong>
        <div className="grid gap-3">
          {orderedScenes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
              No scenes yet. Use the next step above to build them.
            </div>
          ) : (
            orderedScenes.map((scene, index) => {
              const status = displayStatus(scene);

              return (
                <div
                  key={scene.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/80">
                        {`Shot ${index + 1} • ${getSceneDirection(scene).emotionalArcPosition}`}
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {index + 1}. {scene.title}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GlassButton variant="ghost" onClick={() => moveScene(scene.id, -1)} disabled={index === 0}>Move up</GlassButton>
                        <GlassButton variant="ghost" onClick={() => moveScene(scene.id, 1)} disabled={index === orderedScenes.length - 1}>Move down</GlassButton>
                        <GlassButton variant="ghost" onClick={() => setCollapsedScenes((current) => ({ ...current, [scene.id]: !current[scene.id] }))}>
                          {collapsedScenes[scene.id] ? "Expand scene" : "Collapse scene"}
                        </GlassButton>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <GlassBadge tone="default">{status}</GlassBadge>
                        <GlassBadge tone="muted">Frame: {scene.frame_job?.status ?? "not_started"}</GlassBadge>
                        {scene.frame_job?.provider ? <GlassBadge tone="muted">{scene.frame_job.provider}</GlassBadge> : null}
                        {scene.duration_seconds ? (
                          <GlassBadge tone="muted">{scene.duration_seconds}s</GlassBadge>
                        ) : null}
                        {scene.media_job_id ? (
                          <GlassBadge tone="muted">Job linked</GlassBadge>
                        ) : (
                          <GlassBadge tone="muted">No job yet</GlassBadge>
                        )}
                        {scene.media_job?.output_asset_id ? (
                          <GlassBadge tone="copper">Asset ready</GlassBadge>
                        ) : null}
                      </div>

                      {!collapsedScenes[scene.id] ? (() => {
                        const direction = getSceneDirection(scene);
                        return (
                          <div className="space-y-3">
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Scene mood</div>
                                <div className="mt-1 text-sm text-white/85">{direction.emotionalBeat}</div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Opening moment</div>
                                <div className="mt-1 text-sm text-white/85">{direction.hook}</div>
                              </div>
                            </div>
                            <div className="grid gap-2 text-xs text-white/70 md:grid-cols-2 xl:grid-cols-3">
                              <div>Camera: <span className="text-white/90">{direction.cameraMotion}</span></div>
                              <div>Framing: <span className="text-white/90">{direction.framing}</span></div>
                              <div>Lighting mood: <span className="text-white/90">{direction.lightingMood}</span></div>
                              <div>Narration tone: <span className="text-white/90">{direction.narrationTone}</span></div>
                              <div>Transition: <span className="text-white/90">{direction.transitionStyle}</span></div>
                              <div>Duration: <span className="text-white/90">{direction.durationEstimate}</span></div>
                              <div>Pacing: <span className="text-white/90">{direction.pacing}</span></div>
                              <div>Arc: <span className="text-white/90">{direction.emotionalArcPosition}</span></div>
                              <div>Scene energy: <span className="text-white/90">{direction.sceneEnergy}</span></div>
                              <div>Emotional intensity: <span className="text-white/90">{direction.emotionalIntensity}</span></div>
                            </div>
                            <div className="rounded-xl border border-cyan-200/20 bg-cyan-500/10 p-3 text-xs text-cyan-100/90">
                              Overlay text style: {direction.overlayText}
                            </div>
                            <div className="grid gap-2 md:grid-cols-3">
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs"><span className="text-white/50">TikTok pacing</span><div className="mt-1 text-white/90">{direction.platformPacing.tiktok}</div></div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs"><span className="text-white/50">Reels rhythm</span><div className="mt-1 text-white/90">{direction.platformPacing.reels}</div></div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs"><span className="text-white/50">Shorts rhythm</span><div className="mt-1 text-white/90">{direction.platformPacing.shorts}</div></div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">Visual direction blocks</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {direction.visualDirectionBlocks.map((block) => (
                                  <GlassBadge key={`${scene.id}-${block}`} tone="muted">{block}</GlassBadge>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-white/65">Scene prompt reference: {scene.prompt}</div>
                          </div>
                        );
                      })() : <div className="text-xs text-white/55">Scene collapsed. Expand to continue creative direction review.</div>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <GlassButton
                          variant="secondary"
                          disabled={anyBusy}
                          onClick={() => void generateSceneFrame(scene.id)}
                        >
                          {scene.frame_job ? "Regenerate reference frame" : "Generate reference frame"}
                        </GlassButton>
                      </div>
                      {scene.frame_job?.error_text ? <div className="text-sm text-red-300">{scene.frame_job.error_text}</div> : null}
                      {scene.media_job?.error_text ? (
                        <div className="text-sm text-red-300">
                          {scene.media_job.error_text}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      {scene.frame_job?.preview_url ? (
                        <img src={scene.frame_job.preview_url} alt={`${scene.title} keyframe`} className="h-44 rounded-2xl border border-white/10 object-cover" />
                      ) : null}

                      {scene.media_job?.preview_url ? (
                        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[11px] uppercase tracking-[0.16em] text-emerald-100/70">
                                Generated video
                              </div>
                              <div className="text-sm font-medium text-white">
                                Scene clip ready
                              </div>
                            </div>
                            <a
                              href={scene.media_job.preview_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-100 underline underline-offset-4"
                            >
                              Open video
                            </a>
                          </div>
                          <video
                            src={scene.media_job.preview_url}
                            controls
                            playsInline
                            preload="metadata"
                            className="h-56 w-full rounded-xl border border-white/10 bg-black object-contain"
                          />
                        </div>
                      ) : scene.media_job?.output_asset_id ? (
                        <div className="rounded-2xl border border-copper-300/20 bg-white/[0.04] p-3 text-sm text-white/70">
                          Video asset is linked, but no preview URL was returned to this page yet. Refresh or sync the scene.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
