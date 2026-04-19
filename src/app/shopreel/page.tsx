import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  splitLifecycleBoardBuckets,
  type OperationContentPiece,
  type OperationGeneration,
  type OperationPublication,
  type OperationPublishJob,
  type OperationRenderJob,
} from "@/features/shopreel/operations/lib/lifecycleBoard";

type AttentionItem = {
  key: string;
  title: string;
  summary: string;
  href: string;
  tone: "default" | "copper" | "muted";
  actionLabel: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function generationTitle(generation: OperationGeneration) {
  const draft = asRecord(generation.story_draft);
  const value = draft && typeof draft.title === "string" ? draft.title : null;
  return value && value.trim().length > 0 ? value : "Untitled generation";
}

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

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const [
    { data: generationData },
    { data: publicationData },
    { data: publishJobData },
    { data: contentPieceData },
    { data: accountsData },
    { data: sourceData },
  ] = await Promise.all([
    legacy
      .from("shopreel_story_generations")
      .select(
        "id, status, review_approval_state, reviewed_by, reviewed_at, review_note, story_draft, generation_metadata, content_piece_id, updated_at, created_at, render_job_id",
      )
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
    legacy
      .from("shopreel_story_sources")
      .select("id, title, kind, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(6),
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

  const sourceIds = (sourceData ?? [])
    .map((row: any) => (typeof row.id === "string" ? row.id : null))
    .filter((value: string | null): value is string => !!value);

  const { data: opportunityData } = sourceIds.length
    ? await legacy
        .from("shopreel_content_opportunities")
        .select("id, story_source_id")
        .eq("shop_id", shopId)
        .in("story_source_id", sourceIds)
        .order("updated_at", { ascending: false })
    : { data: [] };

  const opportunityBySourceId = new Map<string, string>();
  for (const row of opportunityData ?? []) {
    if (
      typeof row.story_source_id === "string" &&
      typeof row.id === "string" &&
      !opportunityBySourceId.has(row.story_source_id)
    ) {
      opportunityBySourceId.set(row.story_source_id, row.id);
    }
  }

  const attentionItems: AttentionItem[] = [
    ...buckets.needsReview.slice(0, 3).map((generation) => ({
      key: `review-${generation.id}`,
      title: generationTitle(generation),
      summary: "Needs review approval",
      href: `/shopreel/generations/${generation.id}`,
      tone: "default" as const,
      actionLabel: "Review",
    })),
    ...buckets.approvedRenderBlocked.slice(0, 3).map(({ generation, reason }) => ({
      key: `render-${generation.id}`,
      title: generationTitle(generation),
      summary: `Render blocked: ${reason.label}`,
      href: `/shopreel/generations/${generation.id}`,
      tone: "copper" as const,
      actionLabel: "Fix render",
    })),
    ...buckets.publishFailures.slice(0, 3).map((failure) => ({
      key: `publish-${failure.publication.id}`,
      title: failure.generation ? generationTitle(failure.generation) : "Publish failure",
      summary: failure.diagnostics.summary,
      href: failure.nextAction.href,
      tone: "muted" as const,
      actionLabel: failure.nextAction.label,
    })),
  ].slice(0, 8);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Operational Dashboard"
      subtitle="What needs review, what is blocked, what failed, and what is publish-ready right now."
      actions={
        <>
          <Link href="/shopreel/create">
            <GlassButton variant="ghost">Create</GlassButton>
          </Link>
          <Link href="/shopreel/generations">
            <GlassButton variant="secondary">Review Queue</GlassButton>
          </Link>
          <Link href="/shopreel/publish-center">
            <GlassButton variant="primary">Open Operations Board</GlassButton>
          </Link>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          {
            label: "Needs Review",
            value: buckets.needsReview.length,
            href: buckets.needsReview[0] ? `/shopreel/generations/${buckets.needsReview[0].id}` : "/shopreel/generations",
          },
          {
            label: "Render Blocked",
            value: buckets.approvedRenderBlocked.length,
            href: buckets.approvedRenderBlocked[0]
              ? `/shopreel/generations/${buckets.approvedRenderBlocked[0].generation.id}`
              : "/shopreel/render-queue",
          },
          {
            label: "Ready to Publish",
            value: buckets.readyToPublish.length,
            href: buckets.readyToPublish[0]
              ? `/shopreel/generations/${buckets.readyToPublish[0].id}`
              : "/shopreel/publish-center",
          },
          {
            label: "Publish Failures",
            value: buckets.publishFailures.length,
            href: buckets.publishFailures[0]?.nextAction.href ?? "/shopreel/publish-queue",
          },
          {
            label: "Scheduled",
            value: buckets.scheduled.length,
            href: "/shopreel/calendar",
          },
          {
            label: "Recently Published",
            value: buckets.recentlyPublished.length,
            href: "/shopreel/published",
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <GlassCard label="KPI" title={String(stat.value)} description={stat.label} strong />
          </Link>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <GlassCard
          label="Needs Attention"
          title="Priority queue"
          description="Highest-priority items requiring operator action right now."
          strong
        >
          {attentionItems.length === 0 ? (
            <div
              className={cx(
                "rounded-2xl border p-4 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary,
              )}
            >
              No urgent items. Continue from ready actions or create new content.
            </div>
          ) : (
            <div className="grid gap-3">
              {attentionItems.map((item) => (
                <div
                  key={item.key}
                  className={cx("rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>{item.title}</div>
                      <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>{item.summary}</div>
                    </div>
                    <GlassBadge tone={item.tone}>{item.summary.split(":")[0]}</GlassBadge>
                  </div>
                  <div className="mt-3">
                    <Link href={item.href}>
                      <GlassButton variant="secondary">{item.actionLabel}</GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Ready"
          title="Next Actions"
          description="Items that can be acted on immediately."
          strong
        >
          <div className="grid gap-3">
            {buckets.readyToPublish.slice(0, 4).map((generation) => (
              <div
                key={generation.id}
                className={cx("rounded-2xl border p-4", glassTheme.border.copper, glassTheme.glass.panelSoft)}
              >
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                  {generationTitle(generation)}
                </div>
                <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                  Approved and publish-ready • updated {timeAgoLabel(generation.updated_at ?? generation.created_at)}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/shopreel/generations/${generation.id}`}>
                    <GlassButton variant="primary">Open publish panel</GlassButton>
                  </Link>
                  <Link href={`/shopreel/editor/video/${generation.id}`}>
                    <GlassButton variant="ghost">Open editor</GlassButton>
                  </Link>
                </div>
              </div>
            ))}

            {buckets.publishFailures
              .filter((failure) => failure.diagnostics.retryable)
              .slice(0, 2)
              .map((failure) => (
                <div
                  key={failure.publication.id}
                  className={cx("rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}
                >
                  <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                    Retry publish: {failure.generation ? generationTitle(failure.generation) : failure.publication.id}
                  </div>
                  <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>{failure.diagnostics.summary}</div>
                  <div className="mt-3">
                    <Link href={failure.nextAction.href}>
                      <GlassButton variant="secondary">{failure.nextAction.label}</GlassButton>
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard
          label="Curated Sources"
          title="Recent source activity"
          description="Highest-value recent inputs with direct next actions."
          strong
        >
          <div className="grid gap-3">
            {(sourceData ?? []).length === 0 ? (
              <div
                className={cx(
                  "rounded-2xl border p-4 text-sm",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.secondary,
                )}
              >
                No recent sources. Add new inputs from Create.
              </div>
            ) : (
              (sourceData ?? []).map((source: any) => {
                const opportunityId =
                  typeof source.id === "string" ? opportunityBySourceId.get(source.id) ?? null : null;
                const href = opportunityId
                  ? `/shopreel/opportunities/${opportunityId}`
                  : "/shopreel/create";

                return (
                  <div
                    key={source.id}
                    className={cx(
                      "grid gap-3 rounded-2xl border p-4 md:grid-cols-[1fr_auto]",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                    )}
                  >
                    <div>
                      <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                        {source.title ?? "Untitled source"}
                      </div>
                      <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>
                        {(source.kind ?? "source").replaceAll("_", " ")} • added {timeAgoLabel(source.created_at ?? null)}
                      </div>
                    </div>
                    <div className="md:self-center md:justify-self-end">
                      <Link href={href}>
                        <GlassButton variant="ghost">
                          {opportunityId ? "Open opportunity" : "Create from source"}
                        </GlassButton>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        <GlassCard
          label="System"
          title="Secondary panels"
          description="Lower-priority navigation and system surfaces."
        >
          <div className="grid gap-3">
            {[
              ["Operations Board", "/shopreel/publish-center", "Deep lifecycle board and approvals"],
              ["Publish Queue", "/shopreel/publish-queue", "Queue diagnostics and publish retries"],
              ["Settings", "/shopreel/settings", "Connections and workspace defaults"],
            ].map(([label, href, description]) => (
              <Link
                key={label}
                href={href}
                className={cx("rounded-2xl border p-4 no-underline", glassTheme.border.softer, glassTheme.glass.panelSoft)}
              >
                <div className={cx("text-base font-medium", glassTheme.text.primary)}>{label}</div>
                <div className={cx("mt-1 text-sm", glassTheme.text.secondary)}>{description}</div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
