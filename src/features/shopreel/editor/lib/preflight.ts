import type { StoryDraft } from "@/features/shopreel/story-builder/types";
import type { EditorVariant } from "@/features/shopreel/editor/lib/session";

export type PreflightCategory = "story" | "visual" | "audio" | "captions" | "platform" | "render";
export type PreflightSeverity = "blocker" | "warning" | "info" | "recommendation";
export type PreflightLevel = "blocked" | "warning" | "ready";
export type PreflightItem = { category: PreflightCategory; severity: PreflightSeverity; message: string };
export type PreflightCategoryScores = Record<"story" | "visual" | "audio" | "captions" | "platformFit" | "renderReadiness", number>;

export type PreflightReport = {
  status: PreflightLevel;
  score: number;
  blockers: PreflightItem[];
  warnings: PreflightItem[];
  info: PreflightItem[];
  recommendations: PreflightItem[];
  categoryScores: PreflightCategoryScores;
  recommendedAction: string;
};

export function runEditorPreflight(draft: StoryDraft, activeVariant: EditorVariant | null): PreflightReport {
  const scenes = draft.scenes;
  const blockers: PreflightItem[] = [];
  const warnings: PreflightItem[] = [];
  const info: PreflightItem[] = [];
  const recommendations: PreflightItem[] = [];
  const duration = scenes.reduce((sum, scene) => sum + Math.max(1, Number(scene.durationSeconds ?? 0)), 0);

  if (scenes.length === 0) blockers.push({ category: "story", severity: "blocker", message: "No scenes in storyboard." });
  if (scenes.some((s) => (s.media ?? []).length === 0)) blockers.push({ category: "visual", severity: "blocker", message: "Missing media in one or more scenes." });
  if (!scenes[0]?.title?.trim()) warnings.push({ category: "story", severity: "warning", message: "Opening scene is weak or missing title direction." });
  if (!draft.cta?.trim()) warnings.push({ category: "captions", severity: "warning", message: "CTA is absent." });
  if (!scenes.at(-1)?.overlayText?.trim() && !scenes.at(-1)?.voiceoverText?.trim()) warnings.push({ category: "story", severity: "warning", message: "Ending scene is empty." });

  const captionCoverage = scenes.length ? scenes.filter((s) => !!s.overlayText?.trim()).length / scenes.length : 0;
  if (captionCoverage < 0.5) warnings.push({ category: "captions", severity: "warning", message: "Caption density is low." });
  const uniqueCaptionCount = new Set(scenes.map((s) => (s.overlayText ?? "").trim()).filter(Boolean)).size;
  if (uniqueCaptionCount > 0 && uniqueCaptionCount < Math.ceil(scenes.length * 0.6)) info.push({ category: "captions", severity: "info", message: "Repeated captions detected." });

  const uniqueMedia = new Set(scenes.flatMap((s) => (s.media ?? []).map((m) => m.contentAssetId ?? m.manualAssetId ?? m.url ?? "unknown")));
  if (uniqueMedia.size < Math.max(1, Math.ceil(scenes.length * 0.4))) warnings.push({ category: "visual", severity: "warning", message: "Insufficient media diversity." });

  const durations = scenes.map((s) => Math.max(1, Number(s.durationSeconds ?? 0)));
  const maxDuration = Math.max(...durations, 1);
  const minDuration = Math.min(...durations, 1);
  if (maxDuration - minDuration > 8) info.push({ category: "story", severity: "info", message: "Scene pacing imbalance detected." });

  if (activeVariant) {
    if (duration > activeVariant.targetDuration) blockers.push({ category: "platform", severity: "blocker", message: `Duration ${duration}s exceeds variant target ${activeVariant.targetDuration}s.` });
    if ((activeVariant.targetPlatform === "instagram" || activeVariant.targetPlatform === "youtube_shorts" || activeVariant.targetPlatform === "tiktok") && activeVariant.framingPreference !== "9:16") warnings.push({ category: "platform", severity: "warning", message: "Platform variant framing should be 9:16." });
  }

  if (scenes.some((s) => !s.voiceoverText?.trim())) recommendations.push({ category: "audio", severity: "recommendation", message: "Add voice direction for scenes missing audio guidance." });

  const penalty = blockers.length * 20 + warnings.length * 8 + info.length * 3;
  const score = Math.max(0, 100 - penalty);
  const categoryScores: PreflightCategoryScores = {
    story: Math.max(0, 100 - (warnings.filter((w) => w.category === "story").length + blockers.filter((b) => b.category === "story").length * 2) * 20),
    visual: Math.max(0, 100 - (warnings.filter((w) => w.category === "visual").length + blockers.filter((b) => b.category === "visual").length * 2) * 20),
    audio: scenes.some((s) => !s.voiceoverText?.trim()) ? 70 : 100,
    captions: Math.round(captionCoverage * 100),
    platformFit: activeVariant ? (duration <= activeVariant.targetDuration ? 100 : 40) : 70,
    renderReadiness: blockers.length > 0 ? 20 : warnings.length > 0 ? 75 : 100,
  };

  const status: PreflightLevel = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "warning" : "ready";
  return { status, score, blockers, warnings, info, recommendations, categoryScores, recommendedAction: blockers[0]?.message ?? warnings[0]?.message ?? recommendations[0]?.message ?? "Ready to render." };
}
