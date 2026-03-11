import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";

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
      subtitle="A single queue surface with stronger depth and warmer glass."
    >
      <GlassNav />

      <GlassCard
        label="Renderer"
        title="Active and pending jobs"
        description="Keep this page operational, dense, and warm."
        strong
      >
        <div className="grid gap-3">
          {jobs.map((job) => (
            <div
              key={job.title}
              className={cx(
                "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto_auto]",
                job.state === "Rendering" ? glassTheme.border.copper : glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div>
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                  {job.title}
                </div>
                <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>ETA {job.eta}</div>
              </div>

              <div className="md:self-center">
                <GlassBadge
                  tone={
                    job.state === "Rendering"
                      ? "copper"
                      : job.state === "Queued"
                        ? "default"
                        : "muted"
                  }
                >
                  {job.state}
                </GlassBadge>
              </div>

              <div className={cx("text-sm md:self-center", glassTheme.text.muted)}>
                Queue surface
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </GlassShell>
  );
}
