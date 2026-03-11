import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

const published = [
  { title: "Brake inspection highlight", channel: "Instagram Reels", when: "Yesterday", perf: "12.8K views" },
  { title: "Air brake maintenance tip", channel: "TikTok", when: "2 days ago", perf: "8.2K views" },
  { title: "Wheel seal before / after", channel: "Facebook", when: "4 days ago", perf: "3.1K views" },
];

export default function ShopReelPublishedPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Published"
      subtitle="A calmer content history view with warmer glass rows and clearer hierarchy."
    >
      <GlassNav />

      <GlassCard
        label="History"
        title="Recently published"
        description="This is the clean replacement surface for your posted content list."
        strong
      >
        <div className="grid gap-3">
          {published.map((item) => (
            <div
              key={item.title}
              className={cx(
                "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className="space-y-1">
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                  {item.title}
                </div>
                <div className={cx("text-sm", glassTheme.text.secondary)}>
                  {item.channel} • {item.when}
                </div>
              </div>

              <div className="flex items-center gap-3 md:justify-end">
                <GlassBadge tone="copper">{item.perf}</GlassBadge>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </GlassShell>
  );
}
