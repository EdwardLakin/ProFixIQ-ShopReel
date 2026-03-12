import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
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

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export default async function ShopReelPublishedPage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data } = await legacy
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
      <GlassNav />

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
            {publications.map((item: any) => {
              const metadata = objectRecord(item.metadata ?? {});
              const title =
                typeof metadata.title === "string" && metadata.title.length > 0
                  ? metadata.title
                  : item.platform;

              return (
                <div
                  key={item.id}
                  className={cx(
                    "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                    item.status === "published"
                      ? glassTheme.border.copper
                      : glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {title}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      {item.platform} • {timeAgoLabel(item.published_at ?? item.created_at)}
                    </div>
                    {item.platform_post_url ? (
                      <div className={cx("text-xs", glassTheme.text.muted)}>
                        {item.platform_post_url}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 md:justify-end">
                    <GlassBadge tone={item.status === "published" ? "copper" : "default"}>
                      {item.status}
                    </GlassBadge>
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
