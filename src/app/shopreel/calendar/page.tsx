import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

const days = [
  { day: "Mon", items: 2 },
  { day: "Tue", items: 4 },
  { day: "Wed", items: 3 },
  { day: "Thu", items: 5 },
  { day: "Fri", items: 2 },
  { day: "Sat", items: 1 },
  { day: "Sun", items: 2 },
];

export default function ShopReelCalendarPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Calendar"
      subtitle="Publishing cadence and visibility with warmer, more dimensional glass surfaces."
    >
      <GlassNav />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard
          label="Publishing Week"
          title="Content cadence"
          description="A simple week view placeholder you can wire into your real scheduler."
          strong
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            {days.map((day) => (
              <div
                key={day.day}
                className={cx(
                  "flex items-center justify-between rounded-2xl border p-4",
                  day.items >= 4 ? glassTheme.border.copper : glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div>
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                    {day.day}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {day.items} scheduled item{day.items === 1 ? "" : "s"}
                  </div>
                </div>
                <GlassBadge tone={day.items >= 4 ? "copper" : "muted"}>
                  {day.items} posts
                </GlassBadge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="Best Windows"
          title="Recommended posting times"
          description="Keep this box simple until your analytics-backed timing model is wired in."
        >
          <div className="space-y-3">
            {["8:30 AM", "12:15 PM", "5:40 PM"].map((slot) => (
              <div
                key={slot}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>{slot}</div>
                <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                  Strong recent engagement window
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
