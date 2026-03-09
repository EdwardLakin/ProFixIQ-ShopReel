import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

const items = [
  {
    title: "Inspection highlight from failed brake items",
    source: "WO-4128 • 6 photos • 3 notes",
    score: "92",
    status: "Ready",
  },
  {
    title: "Technician walkthrough clip sequence",
    source: "WO-4133 • 4 clips • voice note",
    score: "86",
    status: "Review",
  },
  {
    title: "Maintenance tip from seasonal service trend",
    source: "AI suggested from recent jobs",
    score: "79",
    status: "Draft",
  },
];

export default function ShopReelOpportunitiesPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Opportunities"
      subtitle="Surface the best candidate content without noisy styling or mixed design systems."
      actions={<GlassButton variant="primary">Generate selected</GlassButton>}
    >
      <GlassNav />

      <GlassCard
        label="Opportunity Queue"
        title="Ranked by content potential"
        description="This page intentionally uses only GlassCard, GlassBadge, and GlassButton."
      >
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="grid gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4 md:grid-cols-[1fr_auto]"
            >
              <div className="space-y-1">
                <div className="text-base font-medium text-[color:#f3ede6]">{item.title}</div>
                <div className="text-sm text-[color:rgba(243,237,230,0.64)]">{item.source}</div>
              </div>

              <div className="flex items-center gap-3 md:justify-end">
                <GlassBadge tone="copper">Score {item.score}</GlassBadge>
                <GlassBadge tone="default">{item.status}</GlassBadge>
                <GlassButton variant="secondary">Open</GlassButton>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </GlassShell>
  );
}