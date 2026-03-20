import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import PublishPlatformButtons from "@/features/shopreel/publishing/components/PublishPlatformButtons";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";

type PlatformStatus = "queued" | "publishing" | "published" | "failed" | "none";
type PlatformKey = "instagram" | "facebook" | "tiktok" | "youtube";

const PLATFORM_KEYS: PlatformKey[] = ["instagram", "facebook", "tiktok", "youtube"];

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

function platformTone(status: PlatformStatus): "default" | "copper" | "muted" {
  if (status === "published") return "copper";
  if (status === "failed") return "muted";
  return "default";
}

function formatPlatformLabel(platform: string, status: PlatformStatus) {
  return status === "none" ? platform : `${platform} · ${status}`;
}

export default async function ShopReelPublishCenterPage(props: {
  searchParams?: Promise<{ campaign?: string }>;
}) {
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
      .limit(100),
    legacy
      .from("shopreel_publish_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const queueByPublicationId = new Map<string, any>();
  for (const job of publishQueue ?? []) {
    if (job.publication_id) {
      queueByPublicationId.set(job.publication_id, job);
    }
  }

  const publicationsByContentPieceId = new Map<string, any[]>();
  for (const publication of recentPublications ?? []) {
    if (!publication.content_piece_id) continue;
    const existing = publicationsByContentPieceId.get(publication.content_piece_id) ?? [];
    existing.push(publication);
    publicationsByContentPieceId.set(publication.content_piece_id, existing);
  }

  const inProgressPublications = (recentPublications ?? []).filter(
    (item: any) => item.status === "queued" || item.status === "publishing"
  );

    const searchParams = (await props.searchParams) ?? {};
  const campaignId = typeof searchParams.campaign === "string" ? searchParams.campaign : null;

return (
    <GlassShell
      eyebrow="ShopReel"
      title="Publish campaign videos"
      subtitle="One place for ready content, scheduled publishing, active queue jobs, and publishing history."
      actions={
        <>
        {campaignId ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            Opened from campaign <span className="font-medium text-white">{campaignId}</span>. You can publish items from this campaign here.
          </div>
        ) : null}
          <Link href="/shopreel/generations">
            <GlassButton variant="ghost">Open generations</GlassButton>
          </Link>
          <Link href="/shopreel/publish-queue">
            <GlassButton variant="secondary">Open queue</GlassButton>
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
          description={`${(readyGenerations ?? []).length} ready generation(s) available for platform publishing.`}
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

                const publicationsForItem = item.content_piece_id
                  ? publicationsByContentPieceId.get(item.content_piece_id) ?? []
                  : [];

                const latestByPlatform = new Map<PlatformKey, any>();
                for (const publication of publicationsForItem) {
                  const platform = publication.platform as PlatformKey | null;
                  if (!platform || !PLATFORM_KEYS.includes(platform)) continue;
                  if (!latestByPlatform.has(platform)) {
                    latestByPlatform.set(platform, publication);
                  }
                }

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
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {PLATFORM_KEYS.map((platform) => {
                        const latest = latestByPlatform.get(platform) ?? null;
                        const status: PlatformStatus = latest?.status ?? "none";

                        return (
                          <GlassBadge key={platform} tone={platformTone(status)}>
                            {formatPlatformLabel(platform, status)}
                          </GlassBadge>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <PublishPlatformButtons
                        generationId={item.id}
                        canPublish={item.status === "ready"}
                        compact
                      />
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
          description={`${(scheduledPublications ?? []).length} scheduled publication(s).`}
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
          description={`${inProgressPublications.length} publication(s) currently queued or publishing.`}
          strong
        >
          {inProgressPublications.length === 0 ? (
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
              {inProgressPublications.map((item: any) => {
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
                        ) : (
                          <div className={cx("mt-2 text-xs", glassTheme.text.muted)}>
                            No publish job attached yet — open Publish Queue to repair it.
                          </div>
                        )}
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
          description={`${(recentPublications ?? []).length} recent publication record(s).`}
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
