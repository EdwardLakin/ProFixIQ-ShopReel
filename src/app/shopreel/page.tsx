import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassStat from "@/features/shopreel/ui/system/GlassStat";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

export default async function ShopReelPage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const [{ count: sourceCount }, { count: generationCount }, { count: readyCount }, { count: queuedRenderCount }] =
    await Promise.all([
      legacy.from("shopreel_story_sources").select("*", { count: "exact", head: true }),
      legacy.from("shopreel_story_generations").select("*", { count: "exact", head: true }),
      legacy
        .from("shopreel_story_generations")
        .select("*", { count: "exact", head: true })
        .eq("status", "ready"),
      legacy
        .from("reel_render_jobs")
        .select("*", { count: "exact", head: true })
        .in("status", ["queued", "rendering"]),
    ]);

  const { data: recentSources } = await legacy
    .from("shopreel_story_sources")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Content automation cockpit"
      subtitle="Business Mode and Creator Mode now share one engine: story source → story builder → editor → render → publish."
      actions={
        <>
          <Link href="/shopreel/create">
            <GlassButton variant="ghost">Creator mode</GlassButton>
          </Link>
          <Link href="/shopreel/opportunities">
            <GlassButton variant="secondary">Business opportunities</GlassButton>
          </Link>
          <Link href="/shopreel/generations">
            <GlassButton variant="primary">Open generations</GlassButton>
          </Link>
        </>
      }
    >
      <ShopReelNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassStat
          label="Story Sources"
          value={String(sourceCount ?? 0)}
          hint="Saved source queue"
          trend="Active"
        />
        <GlassStat
          label="Story Generations"
          value={String(generationCount ?? 0)}
          hint="Draft + queued + ready"
          trend="Building"
        />
        <GlassStat
          label="Queued Renders"
          value={String(queuedRenderCount ?? 0)}
          hint="Jobs waiting or rendering"
          trend="Pipeline"
        />
        <GlassStat
          label="Ready Stories"
          value={String(readyCount ?? 0)}
          hint="Generated and ready"
          trend="Continue editing"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <GlassCard
          label="Recent Story Sources"
          title="What the system can build from"
          description="These are the latest saved sources across business and creator flows."
          strong
        >
          <div className="grid gap-3">
            {(recentSources ?? []).length === 0 ? (
              <div
                className={cx(
                  "rounded-2xl border p-4 text-sm",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.secondary,
                )}
              >
                No saved story sources yet.
              </div>
            ) : (
              (recentSources ?? []).map((item: any) => (
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
                      {String(item.kind).replaceAll("_", " ")} • {String(item.origin).replaceAll("_", " ")}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <GlassBadge tone="default">
                      {String(item.generation_mode ?? "assisted")}
                    </GlassBadge>
                    {Array.isArray(item.tags) && item.tags[0] ? (
                      <GlassBadge tone="copper">{String(item.tags[0])}</GlassBadge>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard
          label="Modes"
          title="Two entry paths"
          description="One engine serving both businesses and creators."
        >
          <div className="space-y-4">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Business Mode</div>
              <div className={cx("mt-1 text-lg font-semibold", glassTheme.text.primary)}>
                Operational events → content
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Creator Mode</div>
              <div className={cx("mt-1 text-lg font-semibold", glassTheme.text.primary)}>
                Idea → story draft → editor
              </div>
            </div>
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
