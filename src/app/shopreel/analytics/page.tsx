import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassStat from "@/features/shopreel/ui/system/GlassStat";

export default function ShopReelAnalyticsPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Analytics"
      subtitle="Warm, legible metrics with cleaner depth and no blue-heavy dashboard feel."
    >
      <GlassNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassStat label="Views" value="128.4K" hint="Last 30 days" trend="+21%" />
        <GlassStat label="Avg Watch Time" value="18.2s" hint="Short-form clips" trend="+3.4s" />
        <GlassStat label="Leads Influenced" value="37" hint="Tracked attribution" trend="+9" />
        <GlassStat label="Best Theme" value="Repair Story" hint="Most saves and shares" trend="Leading" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="What worked"
          title="High-performing patterns"
          description="Use this section later for AI-generated recommendations from your actual data."
        >
          <div className="space-y-3">
            {[
              "Before / after transformations with tight intros",
              "Technician voice overlays under 25 seconds",
              "Educational tips tied to real work order findings",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4 text-sm text-[color:#f3ede6]"
              >
                {item}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="What to change"
          title="Optimization notes"
          description="Keep the insight stack restrained and readable."
        >
          <div className="space-y-3">
            {[
              "Reduce slow logo-heavy openings",
              "Post more midweek educational content",
              "Use fewer text-dense caption slides",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4 text-sm text-[color:#f3ede6]"
              >
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}