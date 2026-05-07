"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { buildEditorSessionFromDraft, type EditorScene, type EditorVariant } from "@/features/shopreel/editor/lib/session";
import { buildPersistedEditorSession, reorderScenesByPersistedOrder, type PersistedCommandHistoryEntry, type PersistedEditorSession } from "@/features/shopreel/editor/lib/sessionPersistence";
import { applyEditorCommand, summarizeCommand, type CommandState, type EditorCommand } from "@/features/shopreel/editor/lib/commands";
import { runEditorPreflight } from "@/features/shopreel/editor/lib/preflight";

type Props = {
  generationId: string;
  initialDraft: StoryDraft;
  initialStatus: string;
  initialRenderUrl: string | null;
  mediaItems: MediaBinItem[];
  persistedEditorSession: PersistedEditorSession | null;
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

function buildDraftTextFromScenes(scenes: StoryScene[]) {
  const voiceLines = scenes
    .map((scene) => (scene.voiceoverText ?? "").trim())
    .filter(Boolean);

  const scriptBlocks = scenes.map((scene) => {
    const heading = scene.role.replaceAll("_", " ").toUpperCase();
    const body = (scene.voiceoverText ?? scene.overlayText ?? "").trim();
    return `${heading}\n${body}`;
  });

  return {
    voiceoverText: voiceLines.join(" "),
    scriptText: scriptBlocks.join("\n\n"),
  };
}

function syncDraftText(draft: StoryDraft): StoryDraft {
  const text = buildDraftTextFromScenes(draft.scenes);
  return {
    ...draft,
    voiceoverText: text.voiceoverText,
    scriptText: text.scriptText,
    targetDurationSeconds: draft.scenes.reduce(
      (sum, scene) => sum + Math.max(1, Number(scene.durationSeconds ?? 0)),
      0,
    ),
  };
}

function buildScriptPanelValue(draft: StoryDraft) {
  return draft.scenes
    .map((scene) => {
      const heading = scene.role.replaceAll("_", " ").toUpperCase();
      const body = (scene.voiceoverText ?? scene.overlayText ?? "").trim();
      return `${heading}\n${body}`;
    })
    .join("\n\n");
}

function applyScriptPanelValue(draft: StoryDraft, value: string): StoryDraft {
  const blocks = value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const nextScenes = draft.scenes.map((scene, index) => {
    const block = blocks[index];
    if (!block) return scene;

    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const body = lines.slice(1).join(" ").trim();
    if (!body) return scene;

    return {
      ...scene,
      voiceoverText: body,
    };
  });

  return syncDraftText({
    ...draft,
    scenes: nextScenes,
  });
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
  const [draft, setDraft] = useState<StoryDraft>(() => {
    const ordered = reorderScenesByPersistedOrder(cloneDraft(props.initialDraft).scenes, props.persistedEditorSession);
    return syncDraftText({ ...cloneDraft(props.initialDraft), scenes: ordered });
  });
  const [selection, setSelection] = useState<TimelineSelection>(() => {
    const sceneId = searchParams.get("scene");
    return sceneId ? { type: "scene", id: sceneId } : null;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isRegeneratingScript, setIsRegeneratingScript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<EditorVariant[]>(() => props.persistedEditorSession?.variants ?? []);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(props.persistedEditorSession?.variants[0]?.id ?? null);
  const [commandHistory, setCommandHistory] = useState<EditorCommand[]>([]);
  const [historyStack, setHistoryStack] = useState<CommandState[]>([{ draft, variants, activeSceneId: null, activeVariantId }]);
  const [historyPointer, setHistoryPointer] = useState(0);
  const [saveState, setSaveState] = useState<"saved"|"unsaved"|"saving"|"failed">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastSavedCommandSummary, setLastSavedCommandSummary] = useState<string>("Never");
  const autosaveTimer = useRef<number | null>(null);

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

  const editorSession = useMemo(() => buildEditorSessionFromDraft(props.generationId, draft), [props.generationId, draft]);

  const scriptPanelValue = useMemo(() => buildScriptPanelValue(draft), [draft]);
  const sequenceSummary = useMemo(() => {
    const sceneCount = draft.scenes.length;
    const ctaIndex = draft.scenes.findIndex((scene) => scene.role === "cta");
    const captionDensity = sceneCount === 0 ? 0 : draft.scenes.filter((scene) => !!scene.overlayText?.trim()).length / sceneCount;
    const introMiddleOutro = {
      intro: Math.ceil(sceneCount * 0.2),
      middle: Math.max(0, Math.floor(sceneCount * 0.6)),
      outro: Math.max(1, sceneCount - Math.ceil(sceneCount * 0.2) - Math.floor(sceneCount * 0.6)),
    };
    return { sceneCount, ctaIndex, captionDensity, introMiddleOutro };
  }, [draft.scenes]);

  const activeVariant = useMemo(() => variants.find((variant) => variant.id === activeVariantId) ?? null, [variants, activeVariantId]);
  const preflight = useMemo(() => runEditorPreflight(draft, activeVariant), [draft, activeVariant]);


  function updateDraft(updater: (prev: StoryDraft) => StoryDraft) {
    setDraft((prev) => syncDraftText(updater(prev)));
  }

  function execCommand(payload: Parameters<typeof applyEditorCommand>[1]) {
    const state: CommandState = { draft, variants, activeSceneId: selectedScene?.id ?? null, activeVariantId };
    const applied = applyEditorCommand(state, payload, editorSession.id);
    setDraft(syncDraftText(applied.nextState.draft));
    setVariants(applied.nextState.variants);
    setActiveVariantId(applied.nextState.activeVariantId);
    setSelection(applied.nextState.activeSceneId ? { type: "scene", id: applied.nextState.activeSceneId } : selection);
    setCommandHistory((prev) => [...prev.slice(-49), applied.command]);
    setHistoryStack((prev) => [...prev.slice(0, historyPointer + 1), applied.nextState].slice(-50));
    setHistoryPointer((prev) => Math.min(49, prev + 1));
    setSaveState("unsaved");
  }

  function undoCommand() {
    if (historyPointer <= 0) return;
    const prevState = historyStack[historyPointer - 1];
    if (!prevState) return;
    setDraft(syncDraftText(prevState.draft));
    setVariants(prevState.variants);
    setActiveVariantId(prevState.activeVariantId);
    setSelection(prevState.activeSceneId ? { type: "scene", id: prevState.activeSceneId } : null);
    setHistoryPointer((p) => Math.max(0, p - 1));
    setSaveState("unsaved");
  }

  function redoCommand() {
    const nextState = historyStack[historyPointer + 1];
    if (!nextState) return;
    setDraft(syncDraftText(nextState.draft));
    setVariants(nextState.variants);
    setActiveVariantId(nextState.activeVariantId);
    setSelection(nextState.activeSceneId ? { type: "scene", id: nextState.activeSceneId } : null);
    setHistoryPointer((p) => p + 1);
    setSaveState("unsaved");
  }

  function moveScene(sceneId: string, direction: -1 | 1) { execCommand({ type: "scene.reorder", sceneId, direction }); }

  function dragScene(sceneId: string, deltaPx: number) {
    if (Math.abs(deltaPx) < PX_PER_SECOND) return;
    moveScene(sceneId, deltaPx > 0 ? 1 : -1);
  }

  function resizeScene(sceneId: string, deltaPx: number) {
    const deltaSeconds = Math.round(deltaPx / PX_PER_SECOND);
    if (deltaSeconds === 0) return;

    execCommand({ type: "scene.update", sceneId, patch: { durationSeconds: Math.max(1, Number(selectedScene?.durationSeconds ?? 3) + deltaSeconds) } });
  }

  function regenerateScriptFromScenes() {
    setIsRegeneratingScript(true);
    setError(null);

    updateDraft((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene) => ({
        ...scene,
        voiceoverText:
          (scene.voiceoverText ?? "").trim() ||
          (scene.overlayText ?? "").trim() ||
          scene.title,
      })),
    }));

    window.setTimeout(() => {
      setIsRegeneratingScript(false);
    }, 250);
  }

  async function saveDraft() {
    try {
      setIsSaving(true);
      setSaveState("saving");
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

      const persisted = buildPersistedEditorSession(draft, variants);
      const historyEntries: PersistedCommandHistoryEntry[] = commandHistory.map((cmd) => ({ id: cmd.id, type: cmd.type, timestamp: cmd.createdAt, summary: summarizeCommand(cmd.type), beforeRef: cmd.before.sceneOrder.join(","), afterRef: cmd.after.sceneOrder.join(",") }));
      persisted.commandHistory = { stack: historyEntries.slice(-50), pointer: historyPointer, limit: 50 };
      persisted.saveState = { state: "saved", pendingCommandCount: Math.max(0, commandHistory.length - 1), lastSavedAt: new Date().toISOString(), lastError: null };
      await fetch(`/api/shopreel/story-generations/${props.generationId}/editor-session`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ editorSession: persisted }),
      });
      setLastSavedCommandSummary(commandHistory.at(-1)?.type ?? "manual save");
      setLastSavedAt(new Date().toISOString());
      setSaveState("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
      setSaveState("failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function renderAgain() {
    try {
      setIsRendering(true);
      setError(null);
      if (preflight.status === "blocked") {
        throw new Error(`Preflight blocked: ${preflight.blockers.map((item) => item.message).join("; ")}`);
      }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preflight }),
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

  useEffect(() => {
    if (saveState !== "unsaved") return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => { void saveDraft(); }, 1200);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [draft, variants, saveState]);

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

              useEffect(() => {
    if (saveState !== "unsaved") return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => { void saveDraft(); }, 1200);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [draft, variants, saveState]);

  useEffect(() => {
    if (saveState !== "unsaved") return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => { void saveDraft(); }, 1200);
    return () => { if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current); };
  }, [draft, variants, saveState]);

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
                        {scene.role} • {scene.durationSeconds ?? 0}s • {scene.media.length} assets
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

        <GlassCard label="Assets" title="Asset graph" description="All known assets connected to this editor session.">
          <div className="grid gap-2">
            {draft.scenes.flatMap((scene) => (scene.media ?? []).map((asset, index) => ({ sceneId: scene.id, sceneTitle: scene.title, index, asset }))).map((entry) => (
              <div key={`${entry.sceneId}-${entry.index}`} className={cx("rounded-xl border p-2 text-xs", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
                <div className="font-medium text-white">{String(entry.asset.metadata?.label ?? "Asset placeholder")} · {(entry.asset.url ? "ready" : "missing")}</div>
                <div className={glassTheme.text.secondary}>Used in {entry.sceneTitle}</div>
              </div>
            ))}
            {draft.scenes.every((scene) => (scene.media ?? []).length === 0) ? <div className={cx("text-xs", glassTheme.text.secondary)}>Unused assets: {props.mediaItems.length}. Missing assets: all scenes currently missing media.</div> : null}
          </div>
        </GlassCard>

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
              <div className="mt-2 text-base font-medium text-white">{sequenceSummary.sceneCount}</div>
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
                {props.initialStatus} • preflight {preflight.score}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Script"
          title="AI script panel"
          description="Edit the full scene-by-scene script. Subtitle chunks rebuild automatically from these scene voice lines."
          strong
          footer={
            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="secondary"
                onClick={() => regenerateScriptFromScenes()}
                disabled={isRegeneratingScript}
              >
                {isRegeneratingScript ? "Regenerating..." : "Regenerate script"}
              </GlassButton>
            </div>
          }
        >
          <GlassTextarea
            label="Structured script"
            value={scriptPanelValue}
            onChange={(e) => {
              const value = e.target.value;
              setDraft((prev) => applyScriptPanelValue(prev, value));
            }}
            className="min-h-[320px]"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Voiceover transcript
              </div>
              <div className="mt-2 text-sm text-white whitespace-pre-wrap">
                {draft.voiceoverText ?? ""}
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
                Script blocks
              </div>
              <div className="mt-2 text-sm text-white whitespace-pre-wrap">
                {draft.scriptText ?? ""}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Sequence"
          title="Sequence preview"
          description="Not frame-accurate timeline. Scene order, duration blocks, transitions, media and caption presence."
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
          onChange={(e) => updateDraft((prev) => ({ ...prev, title: e.target.value }))}
        />

        <GlassTextarea
          label="Hook"
          value={draft.hook ?? ""}
          onChange={(e) => updateDraft((prev) => ({ ...prev, hook: e.target.value }))}
        />

        <GlassTextarea
          label="Caption"
          value={draft.caption ?? ""}
          onChange={(e) => updateDraft((prev) => ({ ...prev, caption: e.target.value }))}
        />

        <GlassTextarea
          label="CTA"
          value={draft.cta ?? ""}
          onChange={(e) => updateDraft((prev) => ({ ...prev, cta: e.target.value }))}
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
                execCommand({ type: "scene.update", sceneId: selectedScene.id, patch: { title: e.target.value } })
              }
            />

            <GlassTextarea
              label="Overlay text"
              value={selectedScene.overlayText ?? ""}
              onChange={(e) =>
                execCommand({ type: "caption.update", sceneId: selectedScene.id, caption: e.target.value })
              }
            />

            <GlassTextarea
              label="Voiceover text"
              value={selectedScene.voiceoverText ?? ""}
              onChange={(e) =>
                execCommand({ type: "audio.update", sceneId: selectedScene.id, voiceover: e.target.value })
              }
            />

            <GlassInput
              label="Duration seconds"
              type="number"
              min={1}
              value={String(selectedScene.durationSeconds ?? 0)}
              onChange={(e) =>
                execCommand({ type: "scene.update", sceneId: selectedScene.id, patch: { durationSeconds: Math.max(1, Number(e.target.value || 1)) } })
              }
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <GlassButton variant="ghost" onClick={() => execCommand({ type: "scene.duplicate", sceneId: selectedScene.id })}>Duplicate scene</GlassButton>
              <GlassButton variant="ghost" onClick={() => execCommand({ type: "scene.split", sceneId: selectedScene.id })}>Split scene</GlassButton>
              <GlassButton variant="ghost" onClick={() => execCommand({ type: "scene.merge", sceneId: selectedScene.id })}>Merge next</GlassButton>
              <GlassButton variant="ghost" onClick={() => execCommand({ type: "scene.remove", sceneId: selectedScene.id })}>Remove scene</GlassButton>
              <GlassButton variant="ghost" onClick={() => execCommand({ type: "asset.attach", sceneId: selectedScene.id, media: { url: null, metadata: { source: "reference", label: "Reference slot" } } })}>Attach ref slot</GlassButton>
            </div>
            <div className={cx("rounded-2xl border p-3 text-xs", glassTheme.border.softer, glassTheme.glass.panelSoft, glassTheme.text.secondary)}>
              Regeneration actions: hook and visual regenerate are currently <strong>local deterministic</strong>. AI-assisted regen is unavailable until a backend endpoint is wired.
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <div className={cx("rounded-xl border p-2 text-xs", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
            Last action: {summarizeCommand(commandHistory.at(-1)?.type ?? "scene.update")} • State: {saveState} {lastSavedAt ? `• Last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}
          </div>
          <div className={cx("rounded-xl border p-2 text-xs", glassTheme.border.softer, glassTheme.glass.panelSoft)}>
            Sequence summary: CTA scene {sequenceSummary.ctaIndex >= 0 ? sequenceSummary.ctaIndex + 1 : "missing"}, caption density {(sequenceSummary.captionDensity * 100).toFixed(0)}%.
          </div>
          <div className={cx("rounded-xl border p-2 text-xs", preflight.blockers.length ? glassTheme.border.copper : glassTheme.border.softer, glassTheme.glass.panelSoft)}>
            Preflight blockers: {preflight.blockers.length ? preflight.blockers.map((item) => item.message).join("; ") : "none"}. Warnings: {preflight.warnings.length}.
          </div>
          <div className="flex gap-2"><GlassButton variant="ghost" onClick={undoCommand} disabled={historyPointer<=0}>Undo</GlassButton><GlassButton variant="ghost" onClick={redoCommand} disabled={!historyStack[historyPointer + 1]}>Redo</GlassButton></div><div className="text-sm font-medium text-white">Variants</div>
          <div className="flex flex-wrap gap-2">
            <GlassButton variant="ghost" onClick={() => execCommand({ type: "variant.create", parentVariantId: activeVariantId, platform: "instagram" })}>Create variant</GlassButton>
            <GlassButton variant="ghost" onClick={() => execCommand({ type: "variant.create", parentVariantId: activeVariantId, platform: "tiktok" })}>TikTok variant</GlassButton>
            <GlassButton variant="ghost" onClick={() => execCommand({ type: "variant.create", parentVariantId: activeVariantId, platform: "youtube_shorts" })}>YouTube Shorts variant</GlassButton>
            <GlassButton variant="ghost" onClick={() => execCommand({ type: "variant.create", parentVariantId: activeVariantId, platform: "ad" })}>Ad variant</GlassButton>
          </div>
          {variants.map((variant) => (
            <button key={variant.id} type="button" onClick={() => execCommand({ type: "variant.setActive", variantId: variant.id })} className={cx("w-full rounded-xl border p-2 text-left text-xs", activeVariantId === variant.id ? glassTheme.border.copper : glassTheme.border.softer, glassTheme.glass.panelSoft)}>{variant.name} • {variant.targetPlatform} • parent {variant.sourceVariantId ?? "root"}</button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
