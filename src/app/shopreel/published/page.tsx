import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

function timeAgoLabel(value: string | null) {
  if (!value) return "unknown";

  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

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
      title="Published"
      subtitle="Content distributed through the ShopReel publishing engine."
    >
      <ShopReelNav />

      <GlassCard
        label="History"
        title="Recently published"
        description="Queued, published, and failed publication attempts."
        strong
      >
        {publications.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary,
            )}
          >
            No published content yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {publications.map((item) => (
              <div
                key={item.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
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
