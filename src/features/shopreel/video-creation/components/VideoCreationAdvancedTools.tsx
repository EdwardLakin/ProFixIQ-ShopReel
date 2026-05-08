"use client";

import { useState } from "react";
import type { Database } from "@/types/supabase";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { STORYBOARD_PRESETS } from "@/features/shopreel/video-creation/lib/storyboardPresets";
import { enhanceCreativePrompt } from "@/features/shopreel/video-creation/lib/enhancer";

type StoryboardRow = Database["public"]["Tables"]["shopreel_storyboards"]["Row"];
type StoryboardSceneRow = Database["public"]["Tables"]["shopreel_storyboard_scenes"]["Row"];
type MediaJobRow = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

type StoryboardWithScenes = StoryboardRow & {
  scenes: StoryboardSceneRow[];
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

export default function VideoCreationAdvancedTools({
  recentStoryboards,
  thumbnailReadyJobs,
}: {
  recentStoryboards: StoryboardWithScenes[];
  thumbnailReadyJobs: MediaJobRow[];
}) {
  const [enhancePrompt, setEnhancePrompt] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [enhancedOutput, setEnhancedOutput] = useState("");
  const [storyboardMessage, setStoryboardMessage] = useState<string | null>(null);
  const [thumbnailMessage, setThumbnailMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingThumbnailJobId, setPendingThumbnailJobId] = useState<string | null>(null);

  async function createStoryboardFromPreset(presetId: string) {
    try {
      setError(null);
      setStoryboardMessage(null);

      const preset = STORYBOARD_PRESETS.find((item) => item.id === presetId);
      if (!preset) throw new Error("Storyboard preset not found.");

      const res = await fetch("/api/shopreel/storyboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: preset.title,
          concept: preset.concept,
          aspectRatio: "9:16",
          scenes: preset.scenes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to create storyboard");
      }

      setStoryboardMessage("Storyboard created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create storyboard");
    }
  }

  async function generateThumbnail(jobId: string) {
    try {
      setPendingThumbnailJobId(jobId);
      setError(null);
      setThumbnailMessage(null);

      const res = await fetch(`/api/shopreel/media-jobs/${jobId}/thumbnail`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to generate thumbnail");
      }

      setThumbnailMessage("Thumbnail asset created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate thumbnail");
    } finally {
      setPendingThumbnailJobId(null);
    }
  }

  function runPromptEnhancer() {
    const output = enhanceCreativePrompt({
      prompt: enhancePrompt,
      brandVoice,
      audience,
      objective,
    });
    setEnhancedOutput(output);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-violet-300/20 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(168,85,247,0.22),transparent_40%),rgba(2,6,23,0.9)] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">Advanced Studio</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">AI Orchestration Console</h3>
        <p className="mt-1 text-sm text-white/70">Storyboard planning, thumbnail staging, and prompt telemetry for production handoff.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
      <GlassCard
        label="Storyboard"
        title="Storyboard mode"
        description="Generate structured scenes before rendering or media generation."
        strong
      >
        <div className="grid gap-3">
          {STORYBOARD_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className={cx(
                "rounded-2xl border p-4 transition hover:-translate-y-0.5 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_45%)]",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft
              )}
            >
              <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                {preset.title}
              </div>
              <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                {preset.concept}
              </div>
              <div className="mt-3">
                <GlassButton variant="secondary" onClick={() => void createStoryboardFromPreset(preset.id)}>
                  Create storyboard
                </GlassButton>
              </div>
            </div>
          ))}

          {storyboardMessage ? (
            <div className={cx("text-sm", glassTheme.text.copperSoft)}>{storyboardMessage}</div>
          ) : null}

          {recentStoryboards.length > 0 ? (
            <div className="grid gap-3 pt-2">
              {recentStoryboards.slice(0, 3).map((storyboard) => (
                <div
                  key={storyboard.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                    {storyboard.title}
                  </div>
                  <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                    {storyboard.scenes.length} scenes • {timeAgoLabel(storyboard.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard
        label="Thumbnail"
        title="Still-frame generation"
        description="Create thumbnail/still-frame assets from completed media jobs."
        strong
      >
        <div className="grid gap-3">
          {thumbnailReadyJobs.length === 0 ? (
            <div className={cx("text-sm", glassTheme.text.secondary)}>
              No completed media jobs yet.
            </div>
          ) : (
            thumbnailReadyJobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className={cx(
                  "rounded-2xl border p-4 bg-[radial-gradient(circle_at_100%_0%,rgba(167,139,250,0.2),transparent_45%)]",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                  {job.title ?? "Untitled media job"}
                </div>
                <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                  {job.job_type} • {timeAgoLabel(job.created_at)}
                </div>
                <div className="mt-3">
                  <GlassButton
                    variant="secondary"
                    onClick={() => void generateThumbnail(job.id)}
                    disabled={pendingThumbnailJobId === job.id}
                  >
                    {pendingThumbnailJobId === job.id ? "Generating..." : "Generate thumbnail"}
                  </GlassButton>
                </div>
              </div>
            ))
          )}

          {thumbnailMessage ? (
            <div className={cx("text-sm", glassTheme.text.copperSoft)}>{thumbnailMessage}</div>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard
        label="Enhancer"
        title="AI prompt enhancer"
        description="Inject brand voice, audience, and objective into prompts."
        strong
      >
        <div className="grid gap-3">
          <textarea
            value={enhancePrompt}
            onChange={(e) => setEnhancePrompt(e.target.value)}
            placeholder="Write a premium vertical video showing a modern repair shop brake inspection."
            rows={4}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
          />
          <input
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="Brand voice"
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
          />
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Audience"
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
          />
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Objective"
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
          />
          <GlassButton variant="secondary" onClick={runPromptEnhancer}>
            Enhance prompt
          </GlassButton>

          {enhancedOutput ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm whitespace-pre-wrap",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.primary
              )}
            >
              {enhancedOutput}
            </div>
          ) : null}

          {error ? (
            <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div>
          ) : null}
        </div>
      </GlassCard>
      </div>
    </div>
  );
}
