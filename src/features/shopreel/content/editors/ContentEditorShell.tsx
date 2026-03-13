"use client";

import { useState } from "react";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassInput from "@/features/shopreel/ui/system/GlassInput";
import GlassTextarea from "@/features/shopreel/ui/system/GlassTextarea";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";

type EditorType = "video" | "blog" | "email" | "post";

export default function ContentEditorShell(props: {
  editorType: EditorType;
  generationId: string;
  initialDraft: StoryDraft;
  initialStatus: string;
}) {
  const [draft, setDraft] = useState<StoryDraft>(props.initialDraft);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sceneLines = draft.scenes
    .map((scene) => scene.voiceoverText ?? scene.overlayText ?? scene.title)
    .filter(Boolean);

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
        throw new Error(json.error ?? "Failed to save");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <GlassCard
        label="Content"
        title={
          props.editorType === "blog"
            ? "Blog editor"
            : props.editorType === "email"
              ? "Email editor"
              : props.editorType === "post"
                ? "Social post editor"
                : "Video editor"
        }
        description="This editor is generated from the same creator research and angle system."
        strong
        footer={
          <div className="flex flex-wrap gap-3">
            <GlassButton variant="secondary" onClick={() => void saveDraft()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
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

        <div className="flex flex-wrap gap-2">
          <GlassBadge tone="default">{props.editorType}</GlassBadge>
          <GlassBadge tone="muted">{props.initialStatus}</GlassBadge>
          <GlassBadge tone="copper">{draft.scenes.length} scenes</GlassBadge>
        </div>

        <GlassInput
          label="Title"
          value={draft.title}
          onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
        />

        {props.editorType === "email" ? (
          <>
            <GlassInput
              label="Subject line"
              value={draft.hook ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, hook: e.target.value }))}
            />
            <GlassInput
              label="Preview text"
              value={draft.summary ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
            />
            <GlassTextarea
              label="Email body"
              value={draft.scriptText ?? sceneLines.join("\n\n")}
              onChange={(e) => setDraft((prev) => ({ ...prev, scriptText: e.target.value }))}
            />
          </>
        ) : props.editorType === "blog" ? (
          <>
            <GlassTextarea
              label="Introduction"
              value={draft.hook ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, hook: e.target.value }))}
            />
            <GlassTextarea
              label="Article body"
              value={draft.scriptText ?? sceneLines.join("\n\n")}
              onChange={(e) => setDraft((prev) => ({ ...prev, scriptText: e.target.value }))}
            />
            <GlassTextarea
              label="Meta description"
              value={draft.summary ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, summary: e.target.value }))}
            />
          </>
        ) : props.editorType === "post" ? (
          <>
            <GlassTextarea
              label="Hook"
              value={draft.hook ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, hook: e.target.value }))}
            />
            <GlassTextarea
              label="Post body"
              value={draft.caption ?? sceneLines.join("\n")}
              onChange={(e) => setDraft((prev) => ({ ...prev, caption: e.target.value }))}
            />
            <GlassTextarea
              label="CTA"
              value={draft.cta ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, cta: e.target.value }))}
            />
          </>
        ) : (
          <>
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
              label="Script"
              value={draft.scriptText ?? sceneLines.join("\n\n")}
              onChange={(e) => setDraft((prev) => ({ ...prev, scriptText: e.target.value }))}
            />
          </>
        )}
      </GlassCard>

      <GlassCard
        label="Structure"
        title="Generated content blocks"
        description="AI-generated structure from your selected angle."
        strong
      >
        <div className="grid gap-3">
          {draft.scenes.map((scene, index) => (
            <div
              key={scene.id}
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                {index + 1}. {scene.title}
              </div>
              <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                {scene.role}
              </div>
              <div className={cx("mt-3 text-sm", glassTheme.text.primary)}>
                {scene.voiceoverText ?? scene.overlayText ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
