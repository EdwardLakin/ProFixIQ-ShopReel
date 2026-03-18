"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

type Scene = {
  id: string;
  title: string;
  role: string;
  durationSeconds: number | null;
  overlayText?: string | null;
  voiceoverText?: string | null;
  media?: Array<{
    id?: string;
    assetId?: string;
    url?: string | null;
    type?: string;
  }>;
};

type StoryDraftLike = {
  title?: string | null;
  hook?: string | null;
  cta?: string | null;
  caption?: string | null;
  scriptText?: string | null;
  voiceoverText?: string | null;
  scenes?: Scene[];
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function GenerationTimelineEditor(props: {
  generationId: string;
  initialDraft: StoryDraftLike;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<StoryDraftLike>(props.initialDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenes = useMemo(() => draft.scenes ?? [], [draft.scenes]);

  function updateScene(sceneId: string, patch: Partial<Scene>) {
    setDraft((current) => ({
      ...current,
      scenes: (current.scenes ?? []).map((scene) =>
        scene.id === sceneId ? { ...scene, ...patch } : scene
      ),
    }));
  }

  async function saveDraft() {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/generations/${props.generationId}/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyDraft: draft,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to save story draft");
      }

      setMessage("Timeline changes saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save story draft");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Timeline"
        title="Story timeline editor"
        description="Adjust scene structure, overlay copy, and voiceover flow before publishing."
        strong
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Hook
              </span>
              <input
                value={draft.hook ?? ""}
                onChange={(e) => setDraft((current) => ({ ...current, hook: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                CTA
              </span>
              <input
                value={draft.cta ?? ""}
                onChange={(e) => setDraft((current) => ({ ...current, cta: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Caption
            </span>
            <textarea
              value={draft.caption ?? ""}
              onChange={(e) => setDraft((current) => ({ ...current, caption: e.target.value }))}
              rows={4}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            />
          </label>
        </div>
      </GlassCard>

      <GlassCard
        label="Scenes"
        title="Scene-by-scene control"
        description="Edit each scene as an individual beat in the video."
        strong
      >
        {scenes.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No scenes are attached to this story yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className={cx(
                  "grid gap-4 rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/80">
                      {index + 1}
                    </div>
                    <div>
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        {scene.title}
                      </div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>
                        {formatLabel(scene.role)} • {scene.durationSeconds ?? 0}s
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <GlassBadge tone="default">{formatLabel(scene.role)}</GlassBadge>
                    {scene.media?.length ? (
                      <GlassBadge tone="muted">{scene.media.length} media</GlassBadge>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                      Scene title
                    </span>
                    <input
                      value={scene.title}
                      onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                      Duration
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={scene.durationSeconds ?? 0}
                      onChange={(e) =>
                        updateScene(scene.id, {
                          durationSeconds: Number(e.target.value) || 0,
                        })
                      }
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Overlay text
                  </span>
                  <textarea
                    value={scene.overlayText ?? ""}
                    onChange={(e) => updateScene(scene.id, { overlayText: e.target.value })}
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Voiceover
                  </span>
                  <textarea
                    value={scene.voiceoverText ?? ""}
                    onChange={(e) => updateScene(scene.id, { voiceoverText: e.target.value })}
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>

                {scene.media?.[0]?.url ? (
                  <div className="pt-1">
                    <video
                      src={scene.media[0].url ?? undefined}
                      controls
                      playsInline
                      className="max-h-56 rounded-2xl border border-white/10"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="flex flex-wrap gap-3">
        <GlassButton variant="primary" onClick={() => void saveDraft()} disabled={saving}>
          {saving ? "Saving..." : "Save timeline"}
        </GlassButton>
      </div>

      {message ? (
        <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div>
      ) : null}

      {error ? (
        <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div>
      ) : null}
    </div>
  );
}
