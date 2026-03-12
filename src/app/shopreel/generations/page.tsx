import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { listStoryGenerations } from "@/features/shopreel/story-sources/server/listStoryGenerations";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";

function asStoryDraft(value: unknown): StoryDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as StoryDraft;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

export default async function ShopReelGenerationsPage() {
  const shopId = await getCurrentShopId();
  const generations = await listStoryGenerations({ shopId, limit: 100 });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Generations"
      subtitle="Generated stories, review surfaces, editor access, and publish-ready content."
      actions={
        <Link href="/shopreel/opportunities">
          <GlassButton variant="primary">Open opportunities</GlassButton>
        </Link>
      }
    >
      <ShopReelNav />

      <GlassCard
        label="Generated Stories"
        title="Story generations"
        description="Review, edit, render again, and publish from this list."
        strong
      >
        {generations.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary,
            )}
          >
            No story generations yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {generations.map((generation: any) => {
              const draft = asStoryDraft(generation.story_draft);
              const title = draft?.title ?? "Untitled generation";
              const sourceKind = draft?.sourceKind ?? "story";
              const canPublish = generation.status === "ready";

              return (
                <div
                  key={generation.id}
                  className={cx(
                    "grid gap-4 rounded-2xl border p-4 lg:grid-cols-[1fr_auto]",
                    generation.status === "ready"
                      ? glassTheme.border.copper
                      : glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="space-y-2">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {formatLabel(sourceKind)} • {formatLabel(generation.status)} •{" "}
                      {timeAgoLabel(generation.updated_at ?? generation.created_at)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone="default">{formatLabel(generation.status)}</GlassBadge>
                      {draft?.tone ? (
                        <GlassBadge tone="muted">{formatLabel(draft.tone)}</GlassBadge>
                      ) : null}
                      {generation.render_job_id ? (
                        <GlassBadge tone="copper">Render linked</GlassBadge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <Link href={`/shopreel/generations/${generation.id}`}>
                      <GlassButton variant="ghost">Review</GlassButton>
                    </Link>
                    <Link href={`/shopreel/editor/${generation.id}`}>
                      <GlassButton variant="secondary">Edit</GlassButton>
                    </Link>
                    {canPublish ? (
                      <Link href={`/shopreel/generations/${generation.id}`}>
                        <GlassButton variant="primary">Publish</GlassButton>
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
