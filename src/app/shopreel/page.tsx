// src/app/shopreel/page.tsx

import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassStat from "@/features/shopreel/ui/system/GlassStat";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

export default function ShopReelPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Content automation cockpit"
      subtitle="One coherent glass interface for queue health, publishing flow, and high-value opportunities."
      actions={
        <>
          <GlassButton variant="ghost">Refresh</GlassButton>
          <Link href="/shopreel/upload">
            <GlassButton variant="secondary">Upload content</GlassButton>
          </Link>
          <GlassButton variant="primary">Create content</GlassButton>
        </>
      }
    >
      <GlassNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassStat label="Open Opportunities" value="24" hint="Ready for review" trend="+8 this week" />
        <GlassStat label="Queued Renders" value="11" hint="3 actively rendering" trend="Healthy" />
        <GlassStat label="Scheduled Posts" value="18" hint="Next 7 days" trend="+4 today" />
        <GlassStat label="Published This Month" value="42" hint="Across connected channels" trend="+17%" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <GlassCard
          label="Pipeline"
          title="What needs attention"
          description="Warm glass cards, copper emphasis, and stronger contrast."
          strong
        >
          <div className="grid gap-3">
            {[
              {
                title: "Brake inspection highlight",
                meta: "Truck WO-4128 • 12 source clips",
                badge: "High potential",
              },
              {
                title: "Before / after steering repair",
                meta: "WO-4130 • advisor review needed",
                badge: "Needs approval",
              },
              {
                title: "Educational tip: air brake wear",
                meta: "Built from recent inspections",
                badge: "Evergreen",
              },
            ].map((item) => (
              <div
                key={item.title}
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
                  <div className={cx("text-sm", glassTheme.text.secondary)}>{item.meta}</div>
                </div>
                <GlassBadge tone="copper">{item.badge}</GlassBadge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="Snapshot"
          title="Today"
          description="Simple operational status with warmer emphasis."
        >
          <div className="space-y-4">
            {[
              ["Top channel", "Instagram Reels"],
              ["Best format", "Repair story • 22s clips"],
              ["Next scheduled publish", "Tomorrow • 8:30 AM"],
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
