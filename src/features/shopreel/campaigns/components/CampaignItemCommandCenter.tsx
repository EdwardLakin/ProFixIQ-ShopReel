"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { formatLabel } from "@/features/shopreel/video-creation/lib/types";

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
    provider?: string | null;
    provider_job_id?: string | null;
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

type InfoPanel = "production" | "prompt" | "direction" | "provider" | null;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "not_started").replaceAll("_", " ");
}

function sceneHasFrame(scene: SceneRow) {
  return Boolean(scene.frame_job?.preview_url);
}

function sceneHasVideo(scene: SceneRow) {
  return Boolean(scene.media_job?.preview_url);
}

function sceneIsActive(scene: SceneRow) {
  const status = `${scene.media_job?.status ?? scene.status ?? ""}`.toLowerCase();
  return /queued|submitted|processing|rendering|running|pending/.test(status);
}

function sceneFailed(scene: SceneRow) {
  const status = `${scene.media_job?.status ?? scene.status ?? ""}`.toLowerCase();
  return /failed|error/.test(status) || Boolean(scene.media_job?.error_text || scene.frame_job?.error_text);
}

function getSceneBeat(scene: SceneRow) {
  const metadata = asObject(scene.metadata);
  if (typeof metadata.emotional_beat === "string") return metadata.emotional_beat;
  const first = scene.prompt.split(/(?<=[.!?])\s+/)[0]?.trim();
  return first || "Scene beat pending.";
}

function getSceneDirection(scene: SceneRow) {
  const metadata = asObject(scene.metadata);
  const storyboard = asObject(metadata.storyboard);
  const visual = asObject(metadata.visual_narrative);

  return {
    camera:
      typeof visual.cameraMovement === "string"
        ? visual.cameraMovement
        : typeof storyboard.cameraFeel === "string"
          ? storyboard.cameraFeel
          : "Cinematic handheld",
    lighting:
      typeof visual.lightingMood === "string"
        ? visual.lightingMood
        : "Soft natural",
    pacing:
      typeof storyboard.pacing === "string"
        ? storyboard.pacing
        : "Fast hook, slower emotional hold, clean payoff",
    overlay:
      typeof storyboard.textOverlayStyle === "string"
        ? storyboard.textOverlayStyle
        : "Minimal lower-third captions",
  };
}

export default function CampaignItemCommandCenter({
  item,
  scenes,
}: {
  item: ItemRow;
  scenes: SceneRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [deckCollapsed, setDeckCollapsed] = useState(false);
  const [openPanel, setOpenPanel] = useState<InfoPanel>("production");

  const orderedScenes = useMemo(
    () => [...scenes].sort((a, b) => (a.scene_order ?? 0) - (b.scene_order ?? 0)),
    [scenes],
  );

  const selectedScene = orderedScenes[selectedSceneIndex] ?? orderedScenes[0] ?? null;

  const completedFrames = orderedScenes.filter(sceneHasFrame);
  const completedVideos = orderedScenes.filter(sceneHasVideo);
  const activeVideos = orderedScenes.filter(sceneIsActive);
  const failedScenes = orderedScenes.filter(sceneFailed);
  const readyForVideo = orderedScenes.filter((scene) => sceneHasFrame(scene) && !sceneHasVideo(scene));
  const missingFrames = orderedScenes.filter((scene) => !sceneHasFrame(scene));

  const progressPercent =
    orderedScenes.length > 0 ? Math.round((completedVideos.length / orderedScenes.length) * 100) : 0;

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
      window.setTimeout(() => setStatusMessage(null), 2500);
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
      setStatusMessage("Generating reference frame...");

      const res = await fetch(`/api/shopreel/campaigns/items/${item.id}/scene-frames/${sceneId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run: true }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? "Failed to generate reference frame");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  function nextScene() {
    setSelectedSceneIndex((current) =>
      orderedScenes.length === 0 ? 0 : current + 1 >= orderedScenes.length ? 0 : current + 1,
    );
  }

  function previousScene() {
    setSelectedSceneIndex((current) =>
      orderedScenes.length === 0 ? 0 : current - 1 < 0 ? orderedScenes.length - 1 : current - 1,
    );
  }

  const direction = selectedScene ? getSceneDirection(selectedScene) : null;

  if (orderedScenes.length === 0) {
    return (
      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-5">
        <h2 className="text-xl font-semibold">Video production workspace</h2>
        <p className="mt-2 text-sm text-white/70">This is the video production workspace. Use this after you choose to generate a video.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`/shopreel/campaigns/items/${item.id}/post-review`} className="text-cyan-300 text-sm">Back to post review</a>
          <a href={`/shopreel/campaigns/${item.campaign_id}`} className="text-cyan-300 text-sm">Back to campaign workspace</a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[1.35rem] border border-cyan-200/20 bg-[#06111f]/85 p-5 shadow-[0_12px_34px_rgba(0,0,0,.24)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-100/75">
              Campaign command center
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
              {completedVideos.length > 0
                ? `${completedVideos.length} scene clip${completedVideos.length === 1 ? "" : "s"} ready`
                : completedFrames.length > 0
                  ? "Reference frames ready"
                  : "Build reference frames"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/65">
              Generate one reference frame per scene, then send ready scenes to FAL/Kling image-to-video.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <GlassButton
              variant="secondary"
              disabled={busy !== null || missingFrames.length === 0}
              onClick={() => {
                const next = missingFrames[0];
                if (next) void generateSceneFrame(next.id);
              }}
            >
              {busy?.startsWith("frame-") ? "Generating..." : "Generate next frame"}
            </GlassButton>

            <GlassButton
              variant="primary"
              disabled={busy !== null || readyForVideo.length === 0}
              onClick={() =>
                void runAction(
                  "run-scenes",
                  `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`,
                  "Generating videos for scenes with reference frames...",
                )
              }
            >
              {busy === "run-scenes" ? "Generating..." : "Generate ready videos"}
            </GlassButton>

            <GlassButton
              variant="secondary"
              disabled={busy !== null || activeVideos.length === 0}
              onClick={() =>
                void runAction(
                  "sync-scenes",
                  `/api/shopreel/campaigns/items/${item.id}/sync-scene-jobs`,
                  "Checking video progress...",
                )
              }
            >
              {busy === "sync-scenes" ? "Checking..." : "Sync jobs"}
            </GlassButton>

            <GlassButton
              variant="secondary"
              disabled={busy !== null || completedVideos.length !== orderedScenes.length || orderedScenes.length === 0}
              onClick={() =>
                void runAction(
                  "assemble",
                  `/api/shopreel/campaigns/items/${item.id}/assemble`,
                  "Assembling final campaign video...",
                )
              }
            >
              {busy === "assemble" ? "Assembling..." : "Assemble final"}
            </GlassButton>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Reference frames</div>
            <div className="mt-1 text-xl font-semibold text-white">{completedFrames.length}/{orderedScenes.length}</div>
            <div className="text-xs text-white/55">{missingFrames.length} missing</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Video clips</div>
            <div className="mt-1 text-xl font-semibold text-white">{completedVideos.length}/{orderedScenes.length}</div>
            <div className="text-xs text-white/55">{activeVideos.length} active · {failedScenes.length} failed</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Ready for Kling</div>
            <div className="mt-1 text-xl font-semibold text-white">{readyForVideo.length}</div>
            <div className="text-xs text-white/55">Frame exists, video pending</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Progress</div>
            <div className="mt-1 text-xl font-semibold text-white">{progressPercent}%</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-200" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {statusMessage || error ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm">
            {statusMessage ? <p className="text-cyan-100/80">{statusMessage}</p> : null}
            {error ? <p className="text-rose-200">{error}</p> : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[12rem_minmax(0,1fr)_20rem]">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white/45">Scenes</div>
          <div className="grid gap-2">
            {orderedScenes.map((scene, index) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedSceneIndex(index)}
                className={`rounded-xl border p-3 text-left transition ${
                  index === selectedSceneIndex
                    ? "border-cyan-200/40 bg-cyan-500/15"
                    : "border-white/10 bg-black/15 hover:bg-white/[0.055]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Shot {index + 1}</div>
                <div className="mt-1 line-clamp-2 text-sm font-semibold text-white">{scene.title}</div>
                <div className="mt-2 flex gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${sceneHasFrame(scene) ? "bg-violet-300" : "bg-white/20"}`} />
                  <span className={`h-1.5 w-1.5 rounded-full ${sceneHasVideo(scene) ? "bg-emerald-300" : "bg-white/20"}`} />
                  <span className={`h-1.5 w-1.5 rounded-full ${sceneIsActive(scene) ? "bg-cyan-300" : "bg-white/20"}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <main className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Active scene</div>
              <div className="text-xl font-semibold text-white">
                {selectedScene ? selectedScene.title : "No scene selected"}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={previousScene} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80">←</button>
              <button type="button" onClick={nextScene} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80">→</button>
            </div>
          </div>

          {selectedScene ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Reference image</div>
                  <GlassBadge tone={sceneHasFrame(selectedScene) ? "copper" : "muted"}>
                    {sceneHasFrame(selectedScene) ? "Frame ready" : "Frame needed"}
                  </GlassBadge>
                </div>
                {selectedScene.frame_job?.preview_url ? (
                  <img
                    src={selectedScene.frame_job.preview_url}
                    alt={`${selectedScene.title} reference frame`}
                    className="aspect-[9/16] max-h-[34rem] w-full rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex aspect-[9/16] max-h-[34rem] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center text-sm text-white/55">
                    Generate reference image first.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Generated video</div>
                  <GlassBadge tone={sceneHasVideo(selectedScene) ? "copper" : "muted"}>
                    {sceneHasVideo(selectedScene) ? "Clip ready" : "Video pending"}
                  </GlassBadge>
                </div>
                {selectedScene.media_job?.preview_url ? (
                  <video
                    src={selectedScene.media_job.preview_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-[9/16] max-h-[34rem] w-full rounded-xl border border-white/10 bg-black object-contain"
                  />
                ) : (
                  <div className="flex aspect-[9/16] max-h-[34rem] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.025] p-4 text-center text-sm text-white/55">
                    {selectedScene.frame_job?.preview_url
                      ? "Reference frame ready. Generate video next."
                      : "Video locked until reference image exists."}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>

        <aside className="rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 xl:sticky xl:top-4 xl:self-start">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Operator stack</div>
          {selectedScene ? (
            <div className="mt-3 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-semibold text-white">{selectedScene.title}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <GlassBadge tone={sceneHasVideo(selectedScene) ? "copper" : "default"}>
                    {normalizeStatus(selectedScene.media_job?.status ?? selectedScene.status)}
                  </GlassBadge>
                  <GlassBadge tone={sceneHasFrame(selectedScene) ? "copper" : "muted"}>
                    Frame: {sceneHasFrame(selectedScene) ? "ready" : "needed"}
                  </GlassBadge>
                  <GlassBadge tone={sceneHasVideo(selectedScene) ? "copper" : "muted"}>
                    Video: {sceneHasVideo(selectedScene) ? "ready" : sceneIsActive(selectedScene) ? "active" : "pending"}
                  </GlassBadge>
                </div>
              </div>

              <div className="grid gap-2">
                <GlassButton
                  variant="secondary"
                  disabled={busy !== null}
                  onClick={() => void generateSceneFrame(selectedScene.id)}
                >
                  {selectedScene.frame_job ? "Regenerate reference image" : "Generate reference image"}
                </GlassButton>

                <GlassButton
                  variant="primary"
                  disabled={busy !== null || !selectedScene.frame_job?.preview_url || Boolean(selectedScene.media_job?.preview_url)}
                  onClick={() =>
                    void runAction(
                      "run-scenes",
                      `/api/shopreel/campaigns/items/${item.id}/run-scene-jobs`,
                      "Generating videos for scenes with reference frames...",
                    )
                  }
                >
                  {selectedScene.media_job?.preview_url ? "Video ready" : "Generate video"}
                </GlassButton>
              </div>

              <details className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-sm text-white/65">
                <summary className="cursor-pointer text-white/80">Scene direction</summary>
                <div className="mt-3 space-y-2">
                  <p>{getSceneBeat(selectedScene)}</p>
                  <p>Camera: {direction?.camera}</p>
                  <p>Lighting: {direction?.lighting}</p>
                  <p>Pacing: {direction?.pacing}</p>
                  <p>Overlay: {direction?.overlay}</p>
                </div>
              </details>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
