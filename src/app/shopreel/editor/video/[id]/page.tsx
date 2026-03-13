import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import EditorClient from "@/features/shopreel/editor/components/EditorClient";
import type { MediaBinItem } from "@/features/shopreel/editor/components/MediaBin";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";
import { loadGenerationForEditor } from "@/features/shopreel/content/server/loadGenerationForEditor";

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function detectMediaType(url: string | null): "image" | "video" | "unknown" {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|mov|webm|m4v)(\?|$)/)) return "video";
  if (lower.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/)) return "image";
  return "unknown";
}

export default async function ShopReelVideoEditorPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const { generation, draft } = await loadGenerationForEditor(id);

  if (!generation || !draft) {
    return (
      <GlassShell eyebrow="ShopReel" title="Editor unavailable" subtitle="No story draft exists for this generation.">
        <GlassCard strong>Story draft missing.</GlassCard>
      </GlassShell>
    );
  }

  const metadata = objectRecord(generation.generation_metadata ?? {});
  const renderUrl = typeof metadata.render_url === "string" ? metadata.render_url : null;

  const mediaItems: MediaBinItem[] = [];
  const storyDraft = draft as StoryDraft;

  for (const scene of storyDraft.scenes ?? []) {
    for (const media of scene.media ?? []) {
      const url = typeof media.url === "string" ? media.url : null;
      mediaItems.push({
        id: `${scene.id}:${media.contentAssetId ?? media.manualAssetId ?? url ?? Math.random()}`,
        label: scene.title,
        type: detectMediaType(url),
        url,
      });
    }
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Video Editor"
      subtitle="Timeline-based editor for short-form video output."
      actions={
        <>
          <Link href={`/shopreel/generations/${generation.id}`}>
            <GlassButton variant="ghost">Back to review</GlassButton>
          </Link>
          <Link href="/shopreel/render-queue">
            <GlassButton variant="secondary">Render queue</GlassButton>
          </Link>
        </>
      }
      className="max-w-[1800px]"
    >
      <EditorClient
        generationId={generation.id}
        initialDraft={storyDraft}
        initialStatus={generation.status}
        initialRenderUrl={renderUrl}
        mediaItems={mediaItems}
      />
    </GlassShell>
  );
}
