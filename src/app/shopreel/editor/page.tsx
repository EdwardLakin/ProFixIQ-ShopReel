import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

export default async function ShopReelEditorHubPage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: generations } = await legacy
    .from("shopreel_story_generations")
    .select("id, status, created_at, story_draft")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Editor"
      subtitle="Open a saved generation and continue script, timeline, subtitle, and media work."
    >
      <ShopReelNav />

      <GlassCard
        label="Editor Hub"
        title="Recent editable generations"
        description="Open an existing generation, or create a new one from Creator Mode or Opportunities."
        strong
      >
        {(generations ?? []).length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary,
            )}
          >
            No saved generations yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {(generations ?? []).map((item: any) => (
              <div
                key={item.id}
                className={cx(
                  "flex items-center justify-between gap-4 rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="space-y-1">
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                    {item.story_draft?.title ?? "Untitled generation"}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {item.status} • {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>

                <Link href={`/shopreel/editor/video/${item.id}`}>
                  <GlassButton variant="secondary">Open editor</GlassButton>
                </Link>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
