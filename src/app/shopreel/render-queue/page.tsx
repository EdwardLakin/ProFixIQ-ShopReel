export const dynamic = "force-dynamic";

import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
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
  const legacy = supabase as any;

  const { data } = await legacy
    .from("reel_render_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const jobs = data ?? [];

  const generationByRenderJob = new Map<string, string>();
  if (jobs.length > 0) {
    const ids = jobs.map((job: any) => job.id);
    const { data: generations } = await legacy
      .from("shopreel_story_generations")
      .select("id, render_job_id")
      .in("render_job_id", ids);

    for (const generation of generations ?? []) {
      if (generation.render_job_id) {
        generationByRenderJob.set(generation.render_job_id, generation.id);
      }
    }
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Video Processing"
      subtitle="This page is only for render jobs. Review and publish happen in Generations and Publish Center."
      actions={
        <>
          <Link href="/shopreel/generations">
            <GlassButton variant="ghost">Open Generations</GlassButton>
          </Link>
          <Link href="/shopreel/publish-center">
            <GlassButton variant="secondary">Open Publish Center</GlassButton>
          </Link>
        </>
      }
    >
      <ShopReelNav />

      <GlassCard
        label="Processing"
        title="Active and pending video jobs"
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
            No video processing jobs yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job: any) => {
              const generationId = generationByRenderJob.get(job.id) ?? null;

              return (
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
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      Video Job
                    </div>

                    <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                      Content Piece: {job.content_piece_id ?? "unknown"}
                    </div>

                    <div className={cx("mt-1 text-xs", glassTheme.text.muted)}>
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

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className={cx("text-sm md:self-center", glassTheme.text.muted)}>
                      Attempts {job.attempt_count ?? 0}
                    </div>

                    {generationId ? (
                      <>
                        <Link href={`/shopreel/generations/${generationId}`}>
                          <GlassButton variant="ghost">Review</GlassButton>
                        </Link>
                        <Link href={`/shopreel/editor/video/${generationId}`}>
                          <GlassButton variant="secondary">Edit</GlassButton>
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
