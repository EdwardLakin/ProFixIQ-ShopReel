import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassStat from "@/features/shopreel/ui/system/GlassStat";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

export default function ShopReelPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Content automation cockpit"
      subtitle="One coherent glass interface for queue health, publishing flow, and high-value opportunities."
      actions={
        <>
          <GlassButton variant="ghost">Refresh</GlassButton>
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
          description="Warm glass cards, softer borders, and copper accents only."
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
                className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium text-[color:#f3ede6]">{item.title}</div>
                  <div className="text-sm text-[color:rgba(243,237,230,0.64)]">{item.meta}</div>
                </div>
                <GlassBadge tone="copper">{item.badge}</GlassBadge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="Snapshot"
          title="Today"
          description="Simple operational status without old ShopReel UI remnants."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Top channel</div>
              <div className="mt-1 text-lg font-semibold text-[color:#f3ede6]">Instagram Reels</div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Best format</div>
              <div className="mt-1 text-lg font-semibold text-[color:#f3ede6]">Repair story • 22s clips</div>
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4">
              <div className="text-sm text-[color:rgba(243,237,230,0.62)]">Next scheduled publish</div>
              <div className="mt-1 text-lg font-semibold text-[color:#f3ede6]">Tomorrow • 8:30 AM</div>
            </div>
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}