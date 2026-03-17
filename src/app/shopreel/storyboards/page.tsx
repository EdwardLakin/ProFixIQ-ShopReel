import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { listRecentStoryboards } from "@/features/shopreel/video-creation/lib/storyboards";
import type { Database } from "@/types/supabase";

type StoryboardRow = Database["public"]["Tables"]["shopreel_storyboards"]["Row"];

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

export default async function ShopReelStoryboardsPage() {
  const storyboards = (await listRecentStoryboards(24)) as StoryboardRow[];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Storyboards"
      subtitle="Scene planning, visual direction, and pre-production structure for advanced media creation."
      actions={
        <Link href="/shopreel/video-creation">
          <GlassButton variant="primary">Open Video Creation</GlassButton>
        </Link>
      }
    >
      <ShopReelNav />

      <GlassCard
        label="Recent"
        title="Recent storyboards"
        description="Structured storyboard planning before generation and editing."
        strong
      >
        {storyboards.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No storyboards yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {storyboards.map((storyboard) => (
              <div
                key={storyboard.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {storyboard.title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {timeAgoLabel(storyboard.created_at)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone="default">{storyboard.aspect_ratio}</GlassBadge>
                      {storyboard.style ? (
                        <GlassBadge tone="muted">{storyboard.style}</GlassBadge>
                      ) : null}
                      {storyboard.visual_mode ? (
                        <GlassBadge tone="muted">{storyboard.visual_mode}</GlassBadge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href="/shopreel/video-creation">
                      <GlassButton variant="ghost">Open Studio</GlassButton>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
