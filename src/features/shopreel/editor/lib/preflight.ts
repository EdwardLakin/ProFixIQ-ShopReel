import type { StoryDraft } from "@/features/shopreel/story-builder/types";
import type { EditorVariant } from "@/features/shopreel/editor/lib/session";

export type PreflightCategory = "storyboard" | "assets" | "captions" | "audio" | "pacing" | "platform" | "render";
export type PreflightLevel = "blocked" | "warning" | "ready";
export type PreflightItem = { category: PreflightCategory; message: string };
export type PreflightReport = {
  status: PreflightLevel;
  score: number;
  blockers: PreflightItem[];
  warnings: PreflightItem[];
  info: PreflightItem[];
  recommendedAction: string;
};

export function runEditorPreflight(draft: StoryDraft, activeVariant: EditorVariant | null): PreflightReport {
  const blockers: PreflightItem[] = [];
  const warnings: PreflightItem[] = [];
  const info: PreflightItem[] = [];
  const scenes = draft.scenes;

  if (scenes.length === 0) blockers.push({ category: "storyboard", message: "No scenes in storyboard." });
  if (scenes.some((scene) => !scene.title.trim())) blockers.push({ category: "storyboard", message: "At least one scene is missing title or prompt direction." });
  if (scenes.some((scene) => (scene.media ?? []).length === 0)) blockers.push({ category: "assets", message: "Required media is missing from one or more scenes." });
  if (!draft.cta?.trim()) warnings.push({ category: "captions", message: "CTA copy is missing." });

  const captionCoverage = scenes.length ? scenes.filter((scene) => !!scene.overlayText?.trim()).length / scenes.length : 0;
  if (captionCoverage < 0.6) warnings.push({ category: "captions", message: "Caption coverage is below 60%." });

  const duration = scenes.reduce((sum, scene) => sum + Math.max(1, Number(scene.durationSeconds ?? 0)), 0);
  if (activeVariant && duration > activeVariant.targetDuration) warnings.push({ category: "pacing", message: `Duration ${duration}s exceeds ${activeVariant.targetDuration}s variant target.` });
  if (activeVariant && activeVariant.targetPlatform === "youtube_shorts" && activeVariant.framingPreference !== "9:16") warnings.push({ category: "platform", message: "YouTube Shorts variant should generally use 9:16 framing." });
  if (scenes.some((scene) => !scene.voiceoverText?.trim())) info.push({ category: "audio", message: "Some scenes are direction-only with no explicit voiceover line." });

  const totalIssues = blockers.length * 2 + warnings.length;
  const score = Math.max(0, 100 - totalIssues * 10);
  const status: PreflightLevel = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "warning" : "ready";
  return {
    status,
    score,
    blockers,
    warnings,
    info,
    recommendedAction: blockers[0]?.message ?? warnings[0]?.message ?? "Ready to render.",
  };
}
