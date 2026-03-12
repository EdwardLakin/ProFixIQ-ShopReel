import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassStat from "@/features/shopreel/ui/system/GlassStat";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  listStoryGenerations,
  listStorySources,
} from "@/features/shopreel/story-sources/server";

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

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();

  const [storySources, storyGenerations] = await Promise.all([
    listStorySources({ shopId, limit: 50 }),
    listStoryGenerations({ shopId, limit: 50 }),
  ]);

  const renderQueuedCount = storyGenerations.filter(
    (item) => item.status === "queued",
  ).length;

  const draftCount = storyGenerations.filter(
    (item) => item.status === "draft",
  ).length;

  const recentSources = storySources.slice(0, 5);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Content automation cockpit"
      subtitle="Story Sources now drive the pipeline: discover what happened, turn it into a story, then generate content."
      actions={
        <>
          <Link href="/shopreel/opportunities">
            <GlassButton variant="ghost">Open story sources</GlassButton>
          </Link>
          <Link href="/shopreel/upload">
            <GlassButton variant="secondary">Upload content</GlassButton>
          </Link>
          <Link href="/shopreel/opportunities">
            <GlassButton variant="primary">Generate content</GlassButton>
          </Link>
        </>
      }
    >
      <GlassNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassStat
          label="Story Sources"
          value={String(storySources.length)}
          hint="Saved source queue"
          trend={storySources.length > 0 ? "Active" : "Empty"}
        />
        <GlassStat
          label="Story Generations"
          value={String(storyGenerations.length)}
          hint="Draft + queued generations"
          trend={storyGenerations.length > 0 ? "Building" : "Idle"}
        />
        <GlassStat
          label="Queued Renders"
          value={String(renderQueuedCount)}
          hint="Generations waiting for render"
          trend={renderQueuedCount > 0 ? "Queued" : "None"}
        />
        <GlassStat
          label="Draft Stories"
          value={String(draftCount)}
          hint="Generated and ready to continue"
          trend={draftCount > 0 ? "Ready" : "None"}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <GlassCard
          label="Recent Story Sources"
          title="What the system can build from"
          description="These are the latest saved sources in the ShopReel story pipeline."
          strong
        >
          {recentSources.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No saved story sources yet. Go to Story Sources and click Discover stories to seed the first item.
            </div>
          ) : (
            <div className="grid gap-3">
              {recentSources.map((item) => (
                <div
                  key={item.id}
                  className={cx(
                    "flex items-center justify-between gap-4 rounded-2xl border p-4",
                    glassTheme.border.copper,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="space-y-1">
                    <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                      {item.title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {formatLabel(item.kind)} • {formatLabel(item.origin)} •{" "}
                      {timeAgoLabel(item.created_at)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <GlassBadge tone="default">{formatLabel(item.generation_mode)}</GlassBadge>
                    {item.tags?.slice(0, 1).map((tag) => (
                      <GlassBadge key={tag} tone="copper">
                        {tag}
                      </GlassBadge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Snapshot"
          title="Pipeline state"
          description="Current story pipeline status from the new ShopReel architecture."
        >
          <div className="space-y-4">
            {[
              ["Saved story sources", String(storySources.length)],
              ["Saved generations", String(storyGenerations.length)],
              ["Next action", storySources.length > 0 ? "Generate from Story Sources" : "Seed first Story Source"],
            ].map(([label, value]) => (
              <div
                key={label}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className={cx("text-sm", glassTheme.text.secondary)}>{label}</div>
                <div className={cx("mt-1 text-lg font-semibold", glassTheme.text.primary)}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
