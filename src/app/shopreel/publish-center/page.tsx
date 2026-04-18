import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import PublishPlatformButtons from "@/features/shopreel/publishing/components/PublishPlatformButtons";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  splitLifecycleBoardBuckets,
  type OperationGeneration,
  type OperationPublishJob,
  type OperationPublication,
  type OperationRenderJob,
} from "@/features/shopreel/operations/lib/lifecycleBoard";
import RetryRenderButton from "@/features/shopreel/operations/components/RetryRenderButton";
import EnqueuePublicationButton from "@/features/shopreel/operations/components/EnqueuePublicationButton";

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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function generationTitle(generation: OperationGeneration) {
  const draft = asRecord(generation.story_draft);
  const title = draft && typeof draft.title === "string" ? draft.title : null;
  if (title && title.trim().length > 0) {
    return title;
  }
  return "Untitled generation";
}

function publicationTitle(publication: OperationPublication) {
  const metadata = asRecord(publication.metadata);
  const title = metadata && typeof metadata.title === "string" ? metadata.title : null;
  if (title && title.trim().length > 0) {
    return title;
  }

  return publication.platform ?? "Publication";
}

export default async function ShopReelPublishCenterPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const [
    { data: generationData },
    { data: publicationData },
    { data: publishJobData },
    { data: accountsData },
  ] = await Promise.all([
    legacy
      .from("shopreel_story_generations")
      .select("id, status, story_draft, generation_metadata, content_piece_id, updated_at, created_at, render_job_id")
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false })
      .limit(150),
    legacy
      .from("content_publications")
      .select(
        "id, content_piece_id, status, scheduled_for, published_at, created_at, platform, metadata, error_text, platform_post_url",
      )
      .or(`tenant_shop_id.eq.${shopId},source_shop_id.eq.${shopId}`)
      .order("created_at", { ascending: false })
      .limit(200),
    legacy
      .from("shopreel_publish_jobs")
      .select("id, publication_id, status, error_message")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(200),
    legacy
      .from("content_platform_accounts")
      .select("id")
      .eq("tenant_shop_id", shopId)
      .eq("connection_active", true),
  ]);

  const generations = ((generationData ?? []) as Array<Record<string, unknown>>).map(
    (row): OperationGeneration => ({
      id: typeof row.id === "string" ? row.id : "",
      status: typeof row.status === "string" ? row.status : "draft",
      updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
      render_job_id: typeof row.render_job_id === "string" ? row.render_job_id : null,
      content_piece_id: typeof row.content_piece_id === "string" ? row.content_piece_id : null,
      story_draft: asRecord(row.story_draft),
      generation_metadata: asRecord(row.generation_metadata),
    }),
  );

  const renderJobIds = generations
    .map((generation) => generation.render_job_id)
    .filter((value): value is string => !!value);

  let renderJobs: OperationRenderJob[] = [];
  if (renderJobIds.length > 0) {
    const { data: renderJobData } = await legacy
      .from("reel_render_jobs")
      .select("id, status, error_message")
      .in("id", Array.from(new Set(renderJobIds)));

    renderJobs = ((renderJobData ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      status: typeof row.status === "string" ? row.status : "queued",
      error_message: typeof row.error_message === "string" ? row.error_message : null,
    }));
  }

  const publications: OperationPublication[] = ((publicationData ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: typeof row.id === "string" ? row.id : "",
      content_piece_id: typeof row.content_piece_id === "string" ? row.content_piece_id : null,
      status: typeof row.status === "string" ? row.status : "draft",
      scheduled_for: typeof row.scheduled_for === "string" ? row.scheduled_for : null,
      published_at: typeof row.published_at === "string" ? row.published_at : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
      platform: typeof row.platform === "string" ? row.platform : null,
      metadata: asRecord(row.metadata),
      error_text: typeof row.error_text === "string" ? row.error_text : null,
      platform_post_url: typeof row.platform_post_url === "string" ? row.platform_post_url : null,
    }),
  );

  const publishJobs: OperationPublishJob[] = ((publishJobData ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: typeof row.id === "string" ? row.id : "",
      publication_id: typeof row.publication_id === "string" ? row.publication_id : "",
      status: typeof row.status === "string" ? row.status : "queued",
      error_message: typeof row.error_message === "string" ? row.error_message : null,
    }),
  );

  const buckets = splitLifecycleBoardBuckets({
    generations,
    renderJobs,
    publications,
    publishJobs,
    readiness: {
      hasConnectedPlatformAccount: (accountsData?.length ?? 0) > 0,
    },
  });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Review + Publish Operations"
      subtitle="Canonical daily board for review queues, blocked renders, publish readiness, scheduling, and recent publishing output."
      actions={
        <>
          <Link href="/shopreel/generations">
            <GlassButton variant="ghost">Open generations</GlassButton>
          </Link>
          <Link href="/shopreel/publish-queue">
            <GlassButton variant="secondary">Open queue</GlassButton>
          </Link>
          <Link href="/shopreel/calendar">
            <GlassButton variant="primary">Open calendar</GlassButton>
          </Link>
        </>
      }
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="Needs Review"
          title="Review-ready backlog"
          description="Rendered items that are not yet review-approved for publish."
          strong
        >
          {buckets.needsReview.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No review backlog. New render-complete items will appear here until they are marked ready.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.needsReview.map((generation) => (
                <div
                  key={generation.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {generationTitle(generation)}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        Not review-approved • updated {timeAgoLabel(generation.updated_at ?? generation.created_at)}
                      </div>
                    </div>
                    <GlassBadge tone="default">{generation.status}</GlassBadge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/shopreel/generations/${generation.id}`}>
                      <GlassButton variant="ghost">Open draft/review</GlassButton>
                    </Link>
                    <Link href={`/shopreel/editor/video/${generation.id}`}>
                      <GlassButton variant="secondary">Open editor</GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Blocked"
          title="Render failed / render blocked"
          description="Items that cannot advance until render issues are fixed."
          strong
        >
          {buckets.renderBlocked.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No render-blocked items.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.renderBlocked.map(({ generation, reason }) => (
                <div
                  key={generation.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.copper,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {generationTitle(generation)}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {reason.label} • updated {timeAgoLabel(generation.updated_at ?? generation.created_at)}
                      </div>
                    </div>
                    <GlassBadge tone="muted">{reason.reason.replaceAll("_", " ")}</GlassBadge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <RetryRenderButton generationId={generation.id} />
                    <Link href={`/shopreel/generations/${generation.id}`}>
                      <GlassButton variant="ghost">Inspect failure</GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Ready"
          title="Ready to publish"
          description="Review-approved generations with render output and no scheduled/published record yet."
          strong
        >
          {buckets.readyToPublish.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No publish-ready generations right now.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.readyToPublish.map((generation) => (
                <div
                  key={generation.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.copper,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {generationTitle(generation)}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        Ready now • updated {timeAgoLabel(generation.updated_at ?? generation.created_at)}
                      </div>
                    </div>
                    <GlassBadge tone="copper">ready</GlassBadge>
                  </div>

                  {buckets.readyBlockedReason ? (
                    <div className={cx("mt-3 text-xs", glassTheme.text.copperSoft)}>
                      Blocked: {buckets.readyBlockedReason.label}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/shopreel/generations/${generation.id}`}>
                      <GlassButton variant="ghost">Open review</GlassButton>
                    </Link>
                  </div>

                  <div className="mt-4">
                    <PublishPlatformButtons
                      generationId={generation.id}
                      canPublish={!buckets.readyBlockedReason}
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Scheduled"
          title="Scheduled content"
          description={`${buckets.scheduled.length} scheduled publications with queue visibility.`}
          strong
        >
          {buckets.scheduled.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              Nothing scheduled yet. Open Calendar to set publish times.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.scheduled.map((publication) => (
                <div
                  key={publication.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {publicationTitle(publication)}
                      </div>
                      <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                        {publication.platform ?? "platform"} • {new Date(publication.scheduled_for ?? "").toLocaleString()}
                      </div>
                    </div>
                    <GlassBadge tone="default">{publication.status}</GlassBadge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {publication.content_piece_id ? (
                      <Link href={`/shopreel/content/${publication.content_piece_id}`}>
                        <GlassButton variant="ghost">Open scheduled item</GlassButton>
                      </Link>
                    ) : null}
                    <Link href="/shopreel/calendar">
                      <GlassButton variant="secondary">Open calendar</GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Recently Published"
          title="Recent publication output"
          description="Most recent successfully published records."
          strong
        >
          {buckets.recentlyPublished.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No published output yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.recentlyPublished.map((publication) => (
                <div
                  key={publication.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {publicationTitle(publication)}
                      </div>
                      <div className={cx("text-sm", glassTheme.text.secondary)}>
                        {publication.platform ?? "platform"} • {timeAgoLabel(publication.published_at ?? publication.created_at)}
                      </div>
                    </div>
                    <GlassBadge tone="copper">published</GlassBadge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {publication.platform_post_url ? (
                      <a href={publication.platform_post_url} target="_blank" rel="noreferrer">
                        <GlassButton variant="ghost">View published output</GlassButton>
                      </a>
                    ) : null}
                    {publication.content_piece_id ? (
                      <Link href={`/shopreel/content/${publication.content_piece_id}`}>
                        <GlassButton variant="secondary">Open content</GlassButton>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Failures"
          title="Publish failures"
          description={`Failed publications: ${buckets.publishFailures.length}. Queue: ${buckets.queueSummary.queuedPublications} queued publication(s), ${buckets.queueSummary.queuedJobs} queued job(s), ${buckets.queueSummary.processingJobs} processing job(s).`}
          strong
        >
          {buckets.publishFailures.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No publish failures in the current window.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.publishFailures.map(({ publication, reason }) => (
                <div
                  key={publication.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.copper,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {publicationTitle(publication)}
                      </div>
                      <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                        {publication.platform ?? "platform"} • {reason}
                      </div>
                    </div>
                    <GlassBadge tone="muted">publish failed</GlassBadge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <EnqueuePublicationButton publicationId={publication.id} />
                    <Link href="/shopreel/publish-queue">
                      <GlassButton variant="ghost">Inspect failure</GlassButton>
                    </Link>
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
