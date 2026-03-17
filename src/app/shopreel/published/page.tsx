import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

function timeAgoLabel(value: string | null) {
  if (!value) return "Unknown";

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

export default async function ShopReelPublishedPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("content_publications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const publications = data ?? [];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Publishing History"
      subtitle="Recent queued, published, and failed publication attempts."
    >
      <ShopReelNav />

      <GlassCard
        label="History"
        title="Recent outcomes"
        description="A record of what has already been sent through the publishing engine."
        strong
      >
        {publications.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No publishing history yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {publications.map((item: any) => (
              <div
                key={item.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="space-y-1">
                  <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                    {(item.metadata as any)?.title ?? item.platform}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {item.platform} • {timeAgoLabel(item.published_at ?? item.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-3 md:justify-end">
                  <GlassBadge tone={item.status === "published" ? "copper" : "default"}>
                    {item.status}
                  </GlassBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
