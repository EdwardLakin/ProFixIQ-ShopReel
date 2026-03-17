import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

function timeAgoLabel(value: string | null) {
  if (!value) return "Unknown";

  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

function publicationTone(
  status: string | null | undefined
): "default" | "copper" | "muted" {
  if (status === "published") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

export default async function ShopReelPublishCenterPage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const [
    { data: readyGenerations },
    { data: scheduledPublications },
    { data: recentPublications },
    { data: publishQueue },
  ] = await Promise.all([
    legacy
      .from("shopreel_story_generations")
      .select("id, status, story_draft, generation_metadata, content_piece_id, updated_at, render_job_id")
      .eq("status", "ready")
      .order("updated_at", { ascending: false })
      .limit(24),
    legacy
      .from("content_publications")
      .select("*")
      .not("scheduled_for", "is", null)
      .order("scheduled_for", { ascending: true })
      .limit(24),
    legacy
      .from("content_publications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24),
    legacy
      .from("shopreel_publish_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const queueByPublicationId = new Map<string, any>();
  for (const job of publishQueue ?? []) {
    if (job.publication_id) {
      queueByPublicationId.set(job.publication_id, job);
    }
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Publish Center"
      subtitle="One place for ready content, scheduled publishing, active queue jobs, and publishing history."
      actions={
        <>
          <Link href="/shopreel/generations">
            <GlassButton variant="ghost">Open generations</GlassButton>
          </Link>
          <Link href="/shopreel/calendar">
            <GlassButton variant="secondary">Open calendar</GlassButton>
          </Link>
          <Link href="/shopreel/published">
            <GlassButton variant="primary">History</GlassButton>
          </Link>
        </>
      }
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="Ready"
          title="Ready to publish"
          description="Generated content that is ready for review and platform publishing."
          strong
        >
          {(readyGenerations ?? []).length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary
              )}
            >
              No ready generations yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {(readyGenerations ?? []).map((item: any) => {
                const draft =
                  item.story_draft && typeof item.story_draft === "object"
                    ? item.story_draft
                    : {};
                const title =
                  typeof draft.title === "string" && draft.title.trim().length > 0
                    ? draft.title
                    : "Untitled generation";

                return (
                  <div
                    key={item.id}
                    className={cx(
                      "rounded-2xl border p-4",
                      glassTheme.border.copper,
                      glassTheme.glass.panelSoft
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                          {title}
                        </div>
                        <div className={cx("text-sm", glassTheme.text.secondary)}>
                          Ready for review or publish • {timeAgoLabel(item.updated_at ?? null)}
                        </div>
                      </div>

                      <GlassBadge tone="copper">ready</GlassBadge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/shopreel/generations/${item.id}`}>
                        <GlassButton variant="ghost">Review</GlassButton>
                      </Link>
                      <Link href={`/shopreel/story-generations/${item.id}`}>
                        <GlassButton variant="secondary">Publish</GlassButton>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Scheduled"
          title="Scheduled publishing"
          description="Items already assigned a future publishing time."
          strong
        >
          {(scheduledPublications ?? []).length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary
              )}
            >
              Nothing scheduled yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {(scheduledPublications ?? []).map((item: any) => (
                <div
                  key={item.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {(item.metadata as any)?.title ?? item.platform ?? "Scheduled publication"}
                      </div>
                      <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                        {item.platform ?? "platform"} •{" "}
                        {item.scheduled_for
                          ? new Date(item.scheduled_for).toLocaleString()
                          : "No scheduled time"}
                      </div>
                    </div>

                    <GlassBadge tone="default">{item.status ?? "scheduled"}</GlassBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="In Progress"
          title="Publishing now"
          description="Queue and worker activity for outbound publishing."
          strong
        >
          {(recentPublications ?? []).filter(
            (item: any) =>
              item.status === "queued" ||
              item.status === "publishing" ||
              item.status === "processing"
          ).length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary
              )}
            >
              No publication activity in progress.
            </div>
          ) : (
            <div className="grid gap-3">
              {(recentPublications ?? [])
                .filter(
                  (item: any) =>
                    item.status === "queued" ||
                    item.status === "publishing" ||
                    item.status === "processing"
                )
                .map((item: any) => {
                  const queueJob = queueByPublicationId.get(item.id);

                  return (
                    <div
                      key={item.id}
                      className={cx(
                        "rounded-2xl border p-4",
                        glassTheme.border.copper,
                        glassTheme.glass.panelSoft
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                            {(item.metadata as any)?.title ?? item.platform ?? "Publication"}
                          </div>
                          <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                            {item.platform ?? "platform"} • queued{" "}
                            {timeAgoLabel(item.created_at ?? null)}
                          </div>
                          {queueJob ? (
                            <div className={cx("mt-2 text-xs", glassTheme.text.muted)}>
                              Queue job: {queueJob.status ?? "queued"}
                            </div>
                          ) : null}
                        </div>

                        <GlassBadge tone="default">{item.status ?? "queued"}</GlassBadge>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="History"
          title="Published and failed"
          description="Recent publishing outcomes across all destinations."
          strong
        >
          {(recentPublications ?? []).length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary
              )}
            >
              No history yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {(recentPublications ?? []).map((item: any) => (
                <div
                  key={item.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {(item.metadata as any)?.title ?? item.platform ?? "Publication"}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {item.platform ?? "platform"} •{" "}
                        {timeAgoLabel(item.published_at ?? item.created_at ?? null)}
                      </div>
                      {item.platform_post_url ? (
                        <a
                          href={item.platform_post_url}
                          target="_blank"
                          rel="noreferrer"
                          className={cx("text-sm underline", glassTheme.text.copperSoft)}
                        >
                          Open live post
                        </a>
                      ) : null}
                    </div>

                    <GlassBadge tone={publicationTone(item.status)}>
                      {item.status ?? "unknown"}
                    </GlassBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </section>
    </GlassShell>
  );
}
