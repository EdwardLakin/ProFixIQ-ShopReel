import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";

const jobs = [
  { title: "Brake inspection story", state: "Rendering", eta: "02:14" },
  { title: "Wheel seal before / after", state: "Queued", eta: "05:40" },
  { title: "Air brake safety tip", state: "Queued", eta: "07:05" },
  { title: "Suspension repair recap", state: "Needs asset", eta: "--" },
];

export default function ShopReelRenderQueuePage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Render queue"
      subtitle="A single queue surface with consistent spacing, muted borders, and no leftover white-field styling."
    >
      <GlassNav />

      <GlassCard
        label="Renderer"
        title="Active and pending jobs"
        description="Keep this page operational and quiet — the queue should feel dense, but not cramped."
      >
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div
              key={job.title}
              className="grid gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.035)] p-4 md:grid-cols-[1fr_auto_auto]"
            >
              <div>
                <div className="text-base font-medium text-[color:#f3ede6]">{job.title}</div>
                <div className="mt-1 text-sm text-[color:rgba(243,237,230,0.62)]">ETA {job.eta}</div>
              </div>

              <div className="md:self-center">
                <GlassBadge tone={job.state === "Rendering" ? "copper" : job.state === "Queued" ? "default" : "muted"}>
                  {job.state}
                </GlassBadge>
              </div>

              <div className="text-sm text-[color:rgba(243,237,230,0.62)] md:self-center">
                Glass-only queue row
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </GlassShell>
  );
}