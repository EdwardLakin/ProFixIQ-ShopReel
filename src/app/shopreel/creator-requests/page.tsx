import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function timeAgoLabel(value: string | null) {
  if (!value) return "Unknown";

  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${diffMinutes || 1}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

export default async function ShopReelCreatorRequestsPage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data, error } = await legacy
    .from("shopreel_creator_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const items = data ?? [];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Creator requests"
      subtitle="Stored creator prompts, research runs, angle packs, debunks, and stitch requests."
    >
      <ShopReelNav />

      <GlassCard
        label="Creator memory"
        title="Saved prompt requests"
        description="Every creator prompt can become a reusable request, a future opportunity, or a blog seed."
        strong
      >
        {items.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary,
            )}
          >
            No creator requests yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item: any) => {
              const resultPayload =
                item.result_payload && typeof item.result_payload === "object"
                  ? item.result_payload
                  : {};

              const angles = Array.isArray(resultPayload.angles) ? resultPayload.angles : [];

              return (
                <div
                  key={item.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {item.title}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {formatLabel(item.mode)} • {formatLabel(item.status)} • {timeAgoLabel(item.created_at)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <GlassBadge tone="default">{formatLabel(item.mode)}</GlassBadge>
                      <GlassBadge tone={item.status === "ready" ? "copper" : "muted"}>
                        {formatLabel(item.status)}
                      </GlassBadge>
                      {angles.length > 0 ? (
                        <GlassBadge tone="default">{angles.length} angles</GlassBadge>
                      ) : null}
                    </div>
                  </div>

                  {item.topic ? (
                    <div className={cx("mt-3 text-sm", glassTheme.text.primary)}>
                      {item.topic}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    {item.source_generation_id ? (
                      <>
                        <Link href={`/shopreel/generations/${item.source_generation_id}`}>
                          <GlassButton variant="ghost">Review</GlassButton>
                        </Link>
                        <Link href={`/shopreel/editor/${item.source_generation_id}`}>
                          <GlassButton variant="secondary">Open editor</GlassButton>
                        </Link>
                      </>
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
