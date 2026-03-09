import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

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
      subtitle="A calmer content history view with glass rows and warm text hierarchy."
    >
      <GlassNav />

      <GlassCard
        label="History"
        title="Recently published"
        description="This is the clean replacement surface for your posted content list."
      >
        <div className="grid gap-3">
          {published.map((item) => (
            <div
              key={item.title}
              className="grid gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4 md:grid-cols-[1fr_auto]"
            >
              <div className="space-y-1">
                <div className="text-base font-medium text-[color:#f3ede6]">{item.title}</div>
                <div className="text-sm text-[color:rgba(243,237,230,0.64)]">
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