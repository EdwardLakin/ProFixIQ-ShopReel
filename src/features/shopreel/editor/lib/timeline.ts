import type { StoryDraft, StoryScene } from "@/features/shopreel/story-builder/types";

export type TimelineClip = {
  id: string;
  sceneId: string;
  lane: "video" | "overlay" | "voiceover" | "subtitles";
  label: string;
  startMs: number;
  endMs: number;
  colorClass: string;
};

export type TimelineSelection =
  | { type: "scene"; id: string }
  | { type: "clip"; id: string; lane: TimelineClip["lane"] }
  | null;

export const PX_PER_SECOND = 28;
export const MIN_SCENE_SECONDS = 1;
export const TIMELINE_LEFT_GUTTER = 84;

function sceneDurationMs(scene: StoryScene, fallbackSeconds = 3) {
  const seconds =
    typeof scene.durationSeconds === "number" && scene.durationSeconds > 0
      ? scene.durationSeconds
      : fallbackSeconds;

  return Math.max(1000, Math.round(seconds * 1000));
}

export function draftDurationMs(draft: StoryDraft): number {
  return draft.scenes.reduce((sum, scene) => sum + sceneDurationMs(scene), 0);
}

export function buildTimelineClips(draft: StoryDraft): TimelineClip[] {
  let cursor = 0;
  const clips: TimelineClip[] = [];

  for (const scene of draft.scenes) {
    const duration = sceneDurationMs(scene);
    const startMs = cursor;
    const endMs = cursor + duration;

    clips.push({
      id: `${scene.id}:video`,
      sceneId: scene.id,
      lane: "video",
      label: scene.title,
      startMs,
      endMs,
      colorClass: "border-sky-400/25 bg-sky-400/10",
    });

    if (scene.overlayText?.trim()) {
      clips.push({
        id: `${scene.id}:overlay`,
        sceneId: scene.id,
        lane: "overlay",
        label: scene.overlayText,
        startMs,
        endMs,
        colorClass: "border-fuchsia-400/25 bg-fuchsia-400/10",
      });
    }

    if (scene.voiceoverText?.trim()) {
      clips.push({
        id: `${scene.id}:voiceover`,
        sceneId: scene.id,
        lane: "voiceover",
        label: scene.voiceoverText,
        startMs,
        endMs,
        colorClass: "border-emerald-400/25 bg-emerald-400/10",
      });
    }

    clips.push({
      id: `${scene.id}:subtitles`,
      sceneId: scene.id,
      lane: "subtitles",
      label: scene.voiceoverText?.trim() || scene.overlayText?.trim() || scene.title,
      startMs,
      endMs,
      colorClass: "border-amber-300/25 bg-amber-300/10",
    });

    cursor = endMs;
  }

  return clips;
}

export function msToTimelinePx(ms: number): number {
  return Math.round((ms / 1000) * PX_PER_SECOND);
}

export function pxToSeconds(px: number): number {
  return Math.max(MIN_SCENE_SECONDS, Math.round(px / PX_PER_SECOND));
}

export function formatSecondsLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${mins}:${String(rem).padStart(2, "0")}`;
}
