"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import type { StoryDraft, StoryScene } from "@/features/shopreel/story-builder/types";
import MediaBin, { type MediaBinItem } from "@/features/shopreel/editor/components/MediaBin";
import TimelineLane from "@/features/shopreel/editor/components/TimelineLane";
import TimelineRuler from "@/features/shopreel/editor/components/TimelineRuler";
import {
  buildTimelineClips,
  draftDurationMs,
  formatSecondsLabel,
  PX_PER_SECOND,
  type TimelineSelection,
} from "@/features/shopreel/editor/lib/timeline";
import { buildSubtitleBlocks } from "@/features/shopreel/subtitles/buildSubtitleBlocks";

type Props = {
  generationId: string;
  initialDraft: StoryDraft;
  initialStatus: string;
  initialRenderUrl: string | null;
  mediaItems: MediaBinItem[];
};

function cloneDraft(draft: StoryDraft): StoryDraft {
  return JSON.parse(JSON.stringify(draft)) as StoryDraft;
}

function selectedSceneFromSelection(
  scenes: StoryScene[],
  selection: TimelineSelection,
): StoryScene | null {
  if (!selection) return scenes[0] ?? null;
  if (selection.type === "scene") return scenes.find((scene) => scene.id === selection.id) ?? null;
  if (selection.type === "clip") return scenes.find((scene) => scene.id === selection.id) ?? null;
  return scenes[0] ?? null;
}

function IconAction(props: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm transition",
        glassTheme.border.softer,
        glassTheme.glass.panelSoft,
        glassTheme.text.secondary,
        "hover:text-white hover:bg-white/[0.06]",
      )}
      aria-label={props.label}
      title={props.label}
    >
      {props.label}
    </button>
  );
}

export default function EditorClient(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<StoryDraft>(() => cloneDraft(props.initialDraft));
  const [selection, setSelection] = useState<TimelineSelection>(() => {
    const sceneId = searchParams.get("scene");
    return sceneId ? { type: "scene", id: sceneId } : null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timelineClips = useMemo(() => buildTimelineClips(draft), [draft]);
  const totalMs = useMemo(() => draftDurationMs(draft), [draft]);
  const totalSeconds = Math.round(totalMs / 1000);

  const selectedScene = useMemo(
    () => selectedSceneFromSelection(draft.scenes, selection),
    [draft.scenes, selection],
  );

  const selectedClip = useMemo(() => {
    if (!selection || selection.type !== "clip") return null;
    return timelineClips.find((clip) => clip.id === selection.id) ?? null;
  }, [selection, timelineClips]);

  const subtitleBlocks = useMemo(
    () => buildSubtitleBlocks(draft.voiceoverText ?? draft.scriptText ?? "", totalMs),
    [draft.voiceoverText, draft.scriptText, totalMs],
  );

  function updateScene(sceneId: string, updater: (scene: StoryScene) => StoryScene) {
    setDraft((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => (scene.id === sceneId ? updater(scene) : scene)),
    }));
  }

  function moveScene(sceneId: string, direction: -1 | 1) {
    setDraft((prev) => {
      const index = prev.scenes.findIndex((scene) => scene.id === sceneId);
      if (index < 0) return prev;

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.scenes.length) return prev;

      const nextScenes = [...prev.scenes];
      const [moved] = nextScenes.splice(index, 1);
      nextScenes.splice(nextIndex, 0, moved);

      return {
        ...prev,
        scenes: nextScenes,
      };
    });
  }

  function dragScene(sceneId: string, deltaPx: number) {
    if (Math.abs(deltaPx) < PX_PER_SECOND) return;
    moveScene(sceneId, deltaPx > 0 ? 1 : -1);
  }

  function resizeScene(sceneId: string, deltaPx: number) {
    const deltaSeconds = Math.round(deltaPx / PX_PER_SECOND);
    if (deltaSeconds === 0) return;

    updateScene(sceneId, (scene) => ({
      ...scene,
      durationSeconds: Math.max(1, Number(scene.durationSeconds ?? 3) + deltaSeconds),
    }));
  }

  async function saveDraft() {
    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch(`/api/shopreel/story-generations/${props.generationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyDraft: draft,
        }),
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to save draft");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  }

  async function renderAgain() {
    try {
      setIsRendering(true);
      setError(null);

      const saveRes = await fetch(`/api/shopreel/story-generations/${props.generationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyDraft: draft,
        }),
      });

      const saveJson = (await saveRes.json()) as { ok?: boolean; error?: string };
      if (!saveRes.ok || !saveJson.ok) {
        throw new Error(saveJson.error ?? "Failed to save draft");
      }

      const res = await fetch(`/api/shopreel/story-generations/${props.generationId}/render`, {
        method: "POST",
      });

      const json = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to queue render");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue render");
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <GlassCard
          label="Scenes"
          title="Scene stack"
          description="Select, reorder, and inspect scenes before deeper clip editing."
          strong
        >
          <div className="grid gap-3">
            {draft.scenes.map((scene, index) => {
              const isSelected = selectedScene?.id === scene.id;

              return (
                <div
                  key={scene.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelection({ type: "scene", id: scene.id })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelection({ type: "scene", id: scene.id });
                    }
                  }}
                  className={cx(
                    "rounded-2xl border p-4 text-left transition cursor-pointer",
                    isSelected ? glassTheme.border.copper : glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    isSelected ? "ring-2 ring-sky-300/20" : "hover:ring-1 hover:ring-white/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-white">
                        {index + 1}. {scene.title}
                      </div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>
                        {scene.role} • {scene.durationSeconds ?? 0}s
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <IconAction label="↑" onClick={() => moveScene(scene.id, -1)} />
                      <IconAction label="↓" onClick={() => moveScene(scene.id, 1)} />
                    </div>
                  </div>

                  {scene.overlayText ? (
                    <div className={cx("mt-3 text-sm", glassTheme.text.secondary)}>
                      {scene.overlayText}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </GlassCard>

        <MediaBin items={props.mediaItems} />

        <GlassCard
          label="Subtitles"
          title="Generated subtitle chunks"
          description="These chunks are derived from the current transcript and total duration."
        >
          <div className="grid gap-2">
            {subtitleBlocks.length === 0 ? (
              <div className={cx("text-sm", glassTheme.text.secondary)}>
                No subtitle blocks yet.
              </div>
            ) : (
              subtitleBlocks.map((block, index) => (
                <div
                  key={`${block.startMs}-${block.endMs}-${index}`}
                  className={cx(
                    "rounded-2xl border p-3 text-sm",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                    glassTheme.text.primary,
                  )}
                >
                  <div className={cx("mb-1 text-xs", glassTheme.text.secondary)}>
                    {formatSecondsLabel(Math.floor(block.startMs / 1000))} →{" "}
                    {formatSecondsLabel(Math.ceil(block.endMs / 1000))}
                  </div>
                  {block.text}
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      <div className="space-y-5 min-w-0">
        <GlassCard
          label="Preview"
          title="Program monitor"
          description="Render preview and timeline context."
          strong
        >
          {props.initialRenderUrl ? (
            <div className="mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
              <video
                src={props.initialRenderUrl}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mx-auto flex aspect-[9/16] w-full max-w-[360px] items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-white/70">
              No render preview yet.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Total duration
              </div>
              <div className="mt-2 text-base font-medium text-white">
                {formatSecondsLabel(totalSeconds)}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Scene count
              </div>
              <div className="mt-2 text-base font-medium text-white">{draft.scenes.length}</div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Status
              </div>
              <div className="mt-2 text-base font-medium text-white">
                {props.initialStatus}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Timeline"
          title="Sequence lanes"
          description="Visual timeline with ruler, drag reorder, and resize handles."
          strong
        >
          <div className="space-y-3 overflow-x-auto pb-1">
            <div className="min-w-[900px] space-y-3 pr-2">
              <TimelineRuler durationMs={totalMs} />
              <TimelineLane
                label="Video"
                lane="video"
                clips={timelineClips}
                selectedClipId={selectedClip?.id ?? null}
                onSelectClip={(clipId, _sceneId, lane) =>
                  setSelection({ type: "clip", id: clipId, lane })
                }
                onDragScene={dragScene}
                onResizeScene={resizeScene}
              />
              <TimelineLane
                label="Overlay"
                lane="overlay"
                clips={timelineClips}
                selectedClipId={selectedClip?.id ?? null}
                onSelectClip={(clipId, _sceneId, lane) =>
                  setSelection({ type: "clip", id: clipId, lane })
                }
                onDragScene={dragScene}
                onResizeScene={resizeScene}
              />
              <TimelineLane
                label="Voice"
                lane="voiceover"
                clips={timelineClips}
                selectedClipId={selectedClip?.id ?? null}
                onSelectClip={(clipId, _sceneId, lane) =>
                  setSelection({ type: "clip", id: clipId, lane })
                }
                onDragScene={dragScene}
                onResizeScene={resizeScene}
              />
              <TimelineLane
                label="Subs"
                lane="subtitles"
                clips={timelineClips}
                selectedClipId={selectedClip?.id ?? null}
                onSelectClip={(clipId, _sceneId, lane) =>
                  setSelection({ type: "clip", id: clipId, lane })
                }
                onDragScene={dragScene}
                onResizeScene={resizeScene}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard
        label="Inspector"
        title="Story and scene controls"
        description="Edit story-level metadata and the selected scene."
        strong
        footer={
          <div className="flex flex-wrap gap-3">
            <GlassButton variant="secondary" onClick={() => void saveDraft()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save draft"}
            </GlassButton>
            <GlassButton variant="primary" onClick={() => void renderAgain()} disabled={isRendering}>
              {isRendering ? "Queueing..." : "Render again"}
            </GlassButton>
          </div>
        }
      >
        {error ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.copper,
              glassTheme.glass.panelSoft,
              glassTheme.text.copperSoft,
            )}
          >
            {error}
          </div>
        ) : null}

        <GlassInput
          label="Title"
          value={draft.title}
          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
        />

        <GlassTextarea
          label="Hook"
          value={draft.hook ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, hook: e.target.value }))}
        />

        <GlassTextarea
          label="Caption"
          value={draft.caption ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, caption: e.target.value }))}
        />

        <GlassTextarea
          label="CTA"
          value={draft.cta ?? ""}
          onChange={(e) => setDraft((prev) => ({ ...prev, cta: e.target.value }))}
        />

        {selectedScene ? (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-white">Selected scene</div>
              <GlassBadge tone="default">{selectedScene.role}</GlassBadge>
            </div>

            {selectedClip ? (
              <div
                className={cx(
                  "rounded-2xl border p-3 text-sm",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.secondary,
                )}
              >
                Editing clip lane: {selectedClip.lane}
              </div>
            ) : null}

            <GlassInput
              label="Scene title"
              value={selectedScene.title}
              onChange={(e) =>
                updateScene(selectedScene.id, (scene) => ({
                  ...scene,
                  title: e.target.value,
                }))
              }
            />

            <GlassTextarea
              label="Overlay text"
              value={selectedScene.overlayText ?? ""}
              onChange={(e) =>
                updateScene(selectedScene.id, (scene) => ({
                  ...scene,
                  overlayText: e.target.value,
                }))
              }
            />

            <GlassTextarea
              label="Voiceover text"
              value={selectedScene.voiceoverText ?? ""}
              onChange={(e) =>
                updateScene(selectedScene.id, (scene) => ({
                  ...scene,
                  voiceoverText: e.target.value,
                }))
              }
            />

            <GlassInput
              label="Duration seconds"
              type="number"
              min={1}
              value={String(selectedScene.durationSeconds ?? 0)}
              onChange={(e) =>
                updateScene(selectedScene.id, (scene) => ({
                  ...scene,
                  durationSeconds: Math.max(1, Number(e.target.value || 1)),
                }))
              }
            />
          </>
        ) : null}
      </GlassCard>
    </div>
  );
}
