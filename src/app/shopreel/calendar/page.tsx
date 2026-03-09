import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

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
      subtitle="Publishing cadence and visibility, reset with softer glass surfaces and warmer typography."
    >
      <GlassNav />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard
          label="Publishing Week"
          title="Content cadence"
          description="A simple week view placeholder you can wire into your real scheduler."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            {days.map((day) => (
              <div
                key={day.day}
                className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4"
              >
                <div>
                  <div className="text-sm font-medium text-[color:#f3ede6]">{day.day}</div>
                  <div className="text-sm text-[color:rgba(243,237,230,0.62)]">
                    {day.items} scheduled item{day.items === 1 ? "" : "s"}
                  </div>
                </div>
                <GlassBadge tone={day.items >= 4 ? "copper" : "muted"}>{day.items} posts</GlassBadge>
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
                className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4"
              >
                <div className="text-base font-medium text-[color:#f3ede6]">{slot}</div>
                <div className="mt-1 text-sm text-[color:rgba(243,237,230,0.64)]">
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