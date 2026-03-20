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

  const [
    { count: sourceCount },
    { count: generationCount },
    { count: readyCount },
    { count: queuedRenderCount },
  ] = await Promise.all([
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
      subtitle="A simpler operating model: create → review → process → publish."
      actions={
        <>
          <Link href="/shopreel/create">
            <GlassButton variant="ghost">Create</GlassButton>
          </Link>
          <Link href="/shopreel/generations">
            <GlassButton variant="secondary">Review</GlassButton>
          </Link>
          <Link href="/shopreel/publish-center">
            <GlassButton variant="primary">Publish Center</GlassButton>
          </Link>
        </>
      }
    >
      <ShopReelNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/shopreel/campaigns" className="block">
          <GlassCard
            label="Campaigns"
            title="Campaigns"
            description="Turn one idea into a simple campaign with multiple videos you can review and publish."
            strong
          />
        </Link>

        <Link href="/shopreel/operator" className="block">
          <GlassCard
            label="Control"
            title="Operator Dashboard"
            description="Monitor automation runs, queued jobs, active campaigns, and learnings."
            strong
          />
        </Link>

        <Link href="/shopreel/automation" className="block">
          <GlassCard
            label="Loop"
            title="Automation"
            description="Run the sync, analytics, and learning loop manually."
            strong
          />
        </Link>

        <Link href="/shopreel/analytics" className="block">
          <GlassCard
            label="Performance"
            title="Analytics"
            description="Review real publication, event, and campaign performance."
            strong
          />
        </Link>
      </section>


      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassStat
          label="Story Sources"
          value={String(sourceCount ?? 0)}
          hint="Raw source queue"
          trend="Create"
        />
        <GlassStat
          label="Generations"
          value={String(generationCount ?? 0)}
          hint="Draft + queued + ready"
          trend="Review"
        />
        <GlassStat
          label="Video Processing"
          value={String(queuedRenderCount ?? 0)}
          hint="Jobs waiting or rendering"
          trend="Process"
        />
        <GlassStat
          label="Ready to Publish"
          value={String(readyCount ?? 0)}
          hint="Approved and ready"
          trend="Publish"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <GlassCard
          label="Recent Story Sources"
          title="What the system can build from"
          description="The latest saved sources across business and creator flows."
          strong
        >
          <div className="grid gap-3">
            {(recentSources ?? []).length === 0 ? (
              <div
                className={cx(
                  "rounded-2xl border p-4 text-sm",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.secondary
                )}
              >
                No saved story sources yet.
              </div>
            ) : (
              (recentSources ?? []).map((item: any) => (
                <div
                  key={item.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {item.title ?? item.kind ?? "Untitled source"}
                      </div>

                      <div className={cx("text-sm leading-6", glassTheme.text.secondary)}>
                        {item.summary ??
                          item.description ??
                          "Saved story source ready for generation."}
                      </div>

                      <div className={cx("text-sm", glassTheme.text.muted)}>
                        {item.kind ?? "source"}
                        {item.mode ? ` • ${item.mode}` : ""}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {item.kind ? <GlassBadge tone="default">{item.kind}</GlassBadge> : null}
                      {item.mode ? <GlassBadge tone="default">{item.mode}</GlassBadge> : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard
          label="Operating Model"
          title="Five clear destinations"
          description="One engine, organized around the actions users actually take."
          strong
        >
          <div className="grid gap-3">
            {[
              ["Home", "System overview and next-step entry point"],
              ["Create", "Ideas, uploads, opportunities, AI request flows"],
              ["Pipeline", "Library, generations, review, and video processing"],
              ["Publish", "Publish center, schedule, history, analytics"],
              ["Settings", "Workspace, connections, brand voice, defaults"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                  {title}
                </div>
                <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
