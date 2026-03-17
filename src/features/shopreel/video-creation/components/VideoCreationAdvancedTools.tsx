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
                "rounded-2xl border p-4",
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
                  "rounded-2xl border p-4",
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
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          />
          <input
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            placeholder="Brand voice"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          />
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Audience"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
          />
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Objective"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
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
  );
}
