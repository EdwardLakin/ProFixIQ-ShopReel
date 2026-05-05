export const dynamic = "force-dynamic";

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
  type OperationContentPiece,
} from "@/features/shopreel/operations/lib/lifecycleBoard";
import RetryRenderButton from "@/features/shopreel/operations/components/RetryRenderButton";
import EnqueuePublicationButton from "@/features/shopreel/operations/components/EnqueuePublicationButton";
import ReviewApprovalActions from "@/features/shopreel/operations/components/ReviewApprovalActions";

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
    { data: contentPieceData },
    { data: accountsData },
  ] = await Promise.all([
    legacy
      .from("shopreel_story_generations")
      .select("id, status, review_approval_state, reviewed_by, reviewed_at, review_note, story_draft, generation_metadata, content_piece_id, updated_at, created_at, render_job_id")
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false })
      .limit(150),
    legacy
      .from("content_publications")
      .select(
        "id, content_piece_id, status, scheduled_for, published_at, created_at, updated_at, platform, metadata, error_text, platform_post_url, platform_account_id",
      )
      .or(`tenant_shop_id.eq.${shopId},source_shop_id.eq.${shopId}`)
      .order("created_at", { ascending: false })
      .limit(200),
    legacy
      .from("shopreel_publish_jobs")
      .select("id, publication_id, status, error_message, attempt_count, created_at, updated_at, completed_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(200),
    legacy
      .from("content_pieces")
      .select("id, render_url")
      .eq("tenant_shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(300),
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
      review_approval_state:
        typeof row.review_approval_state === "string" ? row.review_approval_state : null,
      reviewed_by: typeof row.reviewed_by === "string" ? row.reviewed_by : null,
      reviewed_at: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
      review_note: typeof row.review_note === "string" ? row.review_note : null,
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


  const contentPieces: OperationContentPiece[] = ((contentPieceData ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: typeof row.id === "string" ? row.id : "",
      render_url: typeof row.render_url === "string" ? row.render_url : null,
    }),
  );
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
      platform_account_id: typeof row.platform_account_id === "string" ? row.platform_account_id : null,
      updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    }),
  );

  const publishJobs: OperationPublishJob[] = ((publishJobData ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: typeof row.id === "string" ? row.id : "",
      publication_id: typeof row.publication_id === "string" ? row.publication_id : "",
      status: typeof row.status === "string" ? row.status : "queued",
      error_message: typeof row.error_message === "string" ? row.error_message : null,
      attempt_count: typeof row.attempt_count === "number" ? row.attempt_count : null,
      created_at: typeof row.created_at === "string" ? row.created_at : null,
      updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
      completed_at: typeof row.completed_at === "string" ? row.completed_at : null,
    }),
  );

  const buckets = splitLifecycleBoardBuckets({
    generations,
    renderJobs,
    contentPieces,
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
              No review backlog. Render-complete items appear here until explicitly approved.
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
                        Needs explicit approval • updated {timeAgoLabel(generation.updated_at ?? generation.created_at)}
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

                  <div className="mt-3">
                    <ReviewApprovalActions generationId={generation.id} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Blocked"
          title="Approved but render blocked"
          description="Approved items that cannot advance until render issues are resolved."
          strong
        >
          {buckets.approvedRenderBlocked.length === 0 ? (
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
              {buckets.approvedRenderBlocked.map(({ generation, reason }) => (
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

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/shopreel/generations/${generation.id}`}>
                      <GlassButton variant="ghost">Open review</GlassButton>
                    </Link>
                  </div>

                  <div className="mt-4">
                    <PublishPlatformButtons
                      generationId={generation.id}
                      canPublish
                      compact
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>


        <GlassCard
          label="Rejected"
          title="Needs changes"
          description="Items explicitly sent back during review."
          strong
        >
          {buckets.rejected.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No rejected items.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.rejected.map((generation) => (
                <div
                  key={generation.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.copper,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {generationTitle(generation)}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      Needs changes • updated {timeAgoLabel(generation.updated_at ?? generation.created_at)}
                    </div>
                    {generation.review_note ? (
                      <div className={cx("text-xs", glassTheme.text.copperSoft)}>
                        Note: {generation.review_note}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <ReviewApprovalActions generationId={generation.id} compact />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Publish Blocked"
          title="Approved but publish blocked"
          description="Approved items blocked by account/config or current publish state."
          strong
        >
          {buckets.publishBlocked.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No publish-blocked approved items.
            </div>
          ) : (
            <div className="grid gap-3">
              {buckets.publishBlocked.map(({ generation, reason }) => (
                <div
                  key={generation.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.copper,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <div className="space-y-1">
                    <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                      {generationTitle(generation)}
                    </div>
                    <div className={cx("text-sm", glassTheme.text.secondary)}>
                      Blocked: {reason.label}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/shopreel/generations/${generation.id}`}>
                      <GlassButton variant="ghost">Open review</GlassButton>
                    </Link>
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
              {buckets.publishFailures.map(({ publication, publishJob, generation, diagnostics, nextAction }) => (
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
                        {publication.platform ?? "platform"} • {diagnostics.summary}
                      </div>
                      <div className={cx("mt-1 text-xs", glassTheme.text.muted)}>
                        Publication {diagnostics.currentPublicationStatus}
                        {diagnostics.currentPublishJobStatus
                          ? ` • Job ${diagnostics.currentPublishJobStatus}`
                          : ""}
                        {diagnostics.lastAttemptedAt
                          ? ` • Last attempt ${timeAgoLabel(diagnostics.lastAttemptedAt)}`
                          : ""}
                      </div>
                      <div className={cx("mt-1 text-xs", glassTheme.text.secondary)}>
                        Reason: {diagnostics.reasonLabel} • {diagnostics.retryabilityLabel}
                      </div>
                    </div>
                    <GlassBadge tone={diagnostics.retryable ? "default" : "muted"}>
                      {diagnostics.retryable ? "failed · retryable" : "failed · blocked"}
                    </GlassBadge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {diagnostics.retryable ? <EnqueuePublicationButton publicationId={publication.id} /> : null}
                    <Link href={nextAction.href}>
                      <GlassButton variant="secondary">{nextAction.label}</GlassButton>
                    </Link>
                    {generation ? (
                      <Link href={`/shopreel/generations/${generation.id}`}>
                        <GlassButton variant="ghost">Open generation</GlassButton>
                      </Link>
                    ) : null}
                    {publication.content_piece_id ? (
                      <Link href={`/shopreel/content/${publication.content_piece_id}`}>
                        <GlassButton variant="ghost">Open content</GlassButton>
                      </Link>
                    ) : null}
                    {publishJob ? (
                      <Link href="/shopreel/publish-queue">
                        <GlassButton variant="ghost">Inspect publish job</GlassButton>
                      </Link>
                    ) : null}
                    <Link href="/shopreel/publish-queue">
                      <GlassButton variant="ghost">Open queue</GlassButton>
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
