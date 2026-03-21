"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  media_job?: {
    id: string;
    status: string;
    output_asset_id: string | null;
    preview_url: string | null;
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
    args.completedScenes > 0 ||
    args.failedScenes > 0
  ) {
    return {
      action: "check_progress" as const,
      label: "Check progress",
      description: "Refresh scene status and assemble the final video when ready.",
    };
  }

  if (args.totalScenes > 0 || args.linkedScenes > 0) {
    return {
      action: "create_videos" as const,
      label: "Create videos",
      description: "Start generating the scene videos for this campaign video.",
    };
  }

  return {
    action: "build_scenes" as const,
    label: "Build scenes",
    description: "Prepare the scenes for this campaign video.",
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

  return (
    <div className="grid gap-5">
      <GlassCard label="Item" title={item.title} description={item.prompt} strong>
        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{item.status}</GlassBadge>
          <GlassBadge tone="muted">{item.angle}</GlassBadge>
          <GlassBadge tone="muted">{aspectRatio}</GlassBadge>
          <GlassBadge tone="muted">{formatLabel(style)}</GlassBadge>
          <GlassBadge tone="muted">{formatLabel(visualMode)}</GlassBadge>
          <GlassBadge tone="muted">{durationSeconds}s</GlassBadge>
          {item.final_output_asset_id ? (
            <GlassBadge tone="copper">Final video ready</GlassBadge>
          ) : null}
        </div>
      </GlassCard>

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

      <GlassCard
        label="Progress"
        title="Video Progress"
        description="Track scene generation before the final video is assembled."
        strong
      >
        <div className="space-y-4">
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

      <GlassCard
        label="Next step"
        title={nextAction.label}
        description={nextAction.description}
        strong
      >
        <div className="space-y-4">
          {statusMessage ? (
            <div className="text-sm text-white/60">{statusMessage}</div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {nextAction.action === "build_scenes" ? (
              <GlassButton
                variant="primary"
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
                variant="primary"
                onClick={() =>
                  void runAction(
                    "run-scenes",
                    `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`,
                    "Starting scene video generation..."
                  )
                }
                disabled={anyBusy}
              >
                {busy === "run-scenes" ? "Working..." : "Create videos"}
              </GlassButton>
            ) : null}

            {nextAction.action === "check_progress" ? (
              <GlassButton
                variant="primary"
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
                      "Starting scene video generation..."
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

      <GlassCard
        label="Scenes"
        title="Scene List"
        description="Each scene becomes a video clip before the final video is assembled."
        strong
      >
        <div className="grid gap-3">
          {scenes.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
              No scenes yet. Use the next step above to build them.
            </div>
          ) : (
            scenes.map((scene) => {
              const status = displayStatus(scene);

              return (
                <div
                  key={scene.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-white">
                        {scene.scene_order}. {scene.title}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <GlassBadge tone="default">{status}</GlassBadge>
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

                      <div className="text-sm text-white/70">{scene.prompt}</div>
                      {scene.media_job?.error_text ? (
                        <div className="text-sm text-red-300">
                          {scene.media_job.error_text}
                        </div>
                      ) : null}
                    </div>

                    {scene.media_job?.preview_url ? (
                      <video
                        src={scene.media_job.preview_url}
                        controls
                        playsInline
                        className="h-44 rounded-2xl border border-white/10"
                      />
                    ) : null}
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
