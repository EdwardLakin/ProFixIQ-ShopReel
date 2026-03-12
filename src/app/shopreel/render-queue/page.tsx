import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return new Date(value).toLocaleDateString();
}

export default async function ShopReelRenderQueuePage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("reel_render_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const jobs = data ?? [];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Render queue"
      subtitle="Rendering pipeline for generated ShopReel stories."
    >
      <GlassNav />

      <GlassCard
        label="Renderer"
        title="Active and pending jobs"
        description="Jobs move from queued → rendering → ready."
        strong
      >
        {jobs.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No render jobs yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto_auto]",
                  job.status === "rendering"
                    ? glassTheme.border.copper
                    : glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div>
                  <div
                    className={cx(
                      "text-base font-medium",
                      glassTheme.text.primary
                    )}
                  >
                    Render Job
                  </div>

                  <div
                    className={cx(
                      "mt-1 text-sm",
                      glassTheme.text.secondary
                    )}
                  >
                    Content Piece: {job.content_piece_id ?? "unknown"}
                  </div>

                  <div
                    className={cx(
                      "mt-1 text-xs",
                      glassTheme.text.muted
                    )}
                  >
                    Created {timeAgoLabel(job.created_at)}
                  </div>
                </div>

                <div className="md:self-center">
                  <GlassBadge
                    tone={
                      job.status === "rendering"
                        ? "copper"
                        : job.status === "queued"
                        ? "default"
                        : job.status === "ready"
                        ? "default"
                        : "muted"
                    }
                  >
                    {job.status}
                  </GlassBadge>
                </div>

                <div
                  className={cx(
                    "text-sm md:self-center",
                    glassTheme.text.muted
                  )}
                >
                  Attempts {job.attempt_count ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
