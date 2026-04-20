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
  priority: "urgent" | "high";
};

type StorySourceRow = {
  id: string;
  title: string | null;
  kind: string | null;
  created_at: string | null;
};

type RecommendedAction = {
  key: string;
  title: string;
  summary: string;
  href: string;
  actionLabel: string;
};
type ThroughputSignal = {
  label: string;
  value: number;
  detail: string;
  href: string;
  tone: "default" | "copper" | "muted";
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
      .limit(8),
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

  const storySources: StorySourceRow[] = ((sourceData ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: typeof row.id === "string" ? row.id : "",
    title: typeof row.title === "string" ? row.title : null,
    kind: typeof row.kind === "string" ? row.kind : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
  }));

  const sourceIds = storySources.map((source) => source.id).filter((value) => value.length > 0);

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
    ...buckets.publishFailures.slice(0, 3).map((failure) => ({
      key: `publish-${failure.publication.id}`,
      title: failure.generation ? generationTitle(failure.generation) : "Publish failure",
      summary: failure.diagnostics.summary,
      href: failure.nextAction.href,
      tone: "muted" as const,
      actionLabel: failure.nextAction.label,
      priority: "urgent" as const,
    })),
    ...buckets.approvedRenderBlocked.slice(0, 3).map(({ generation, reason }) => ({
      key: `render-${generation.id}`,
      title: generationTitle(generation),
      summary: `Render blocked: ${reason.label}`,
      href: `/shopreel/generations/${generation.id}`,
      tone: "copper" as const,
      actionLabel: "Fix render",
      priority: "urgent" as const,
    })),
    ...buckets.needsReview.slice(0, 4).map((generation) => ({
      key: `review-${generation.id}`,
      title: generationTitle(generation),
      summary: "Needs review approval",
      href: `/shopreel/generations/${generation.id}`,
      tone: "default" as const,
      actionLabel: "Review now",
      priority: "high" as const,
    })),
  ].slice(0, 8);

  const recommendedActions: RecommendedAction[] = [];
  if ((accountsData?.length ?? 0) === 0) {
    recommendedActions.push({
      key: "connect-account",
      title: "Connect at least one platform",
      summary: "Publishing remains blocked until a channel is connected.",
      href: "/shopreel/settings",
      actionLabel: "Open settings",
    });
  }
  if (generations.length === 0) {
    recommendedActions.push({
      key: "create-first",
      title: "Create your next generation",
      summary: "No generation exists yet for review or publishing.",
      href: "/shopreel/create",
      actionLabel: "Create content",
    });
  }
  if (storySources.length === 0) {
    recommendedActions.push({
      key: "source-input",
      title: "Add fresh source material",
      summary: "Bring in a new source to seed more high-quality opportunities.",
      href: "/shopreel/create",
      actionLabel: "Add source",
    });
  }
  if (generations.length > 0) {
    recommendedActions.push({
      key: "open-editor",
      title: "Continue active editor work",
      summary: "Open the canonical editor surface for the latest generation.",
      href: `/shopreel/editor/video/${generations[0].id}`,
      actionLabel: "Open editor",
    });
  }
  recommendedActions.push({
    key: "manual-upload",
    title: "Inject source material manually",
    summary: "Manual upload is a first-class source path when automation is sparse.",
    href: "/shopreel/upload",
    actionLabel: "Manual upload",
  });

  const topCta = buckets.publishFailures[0]
    ? { href: buckets.publishFailures[0].nextAction.href, label: "Resolve failure" }
    : buckets.needsReview[0]
      ? { href: `/shopreel/generations/${buckets.needsReview[0].id}`, label: "Start review" }
      : buckets.readyToPublish[0]
        ? { href: `/shopreel/generations/${buckets.readyToPublish[0].id}`, label: "Publish ready item" }
        : { href: "/shopreel/create", label: "Create new content" };

  const kpis = [
    {
      label: "Needs Review",
      value: buckets.needsReview.length,
      detail:
        buckets.needsReview.length > 0
          ? `${Math.min(buckets.needsReview.length, 5)} waiting for approval now`
          : "Nothing waiting. Keep pipeline fed.",
      href: buckets.needsReview[0] ? `/shopreel/generations/${buckets.needsReview[0].id}` : "/shopreel/create",
      actionLabel: buckets.needsReview.length > 0 ? "Open review queue" : "Create next draft",
    },
    {
      label: "Ready to Publish",
      value: buckets.readyToPublish.length,
      detail:
        buckets.readyToPublish.length > 0
          ? "Approved and unblocked items that can publish now"
          : "No publish-ready items yet",
      href: buckets.readyToPublish[0]
        ? `/shopreel/generations/${buckets.readyToPublish[0].id}`
        : "/shopreel/generations",
      actionLabel: buckets.readyToPublish.length > 0 ? "Open ready item" : "Review pending work",
    },
    {
      label: "Publish Failures",
      value: buckets.publishFailures.length,
      detail:
        buckets.publishFailures.length > 0
          ? "Failed attempts need retry or configuration fixes"
          : "No active failures",
      href: buckets.publishFailures[0]?.nextAction.href ?? "/shopreel/publish-queue",
      actionLabel: buckets.publishFailures.length > 0 ? "Diagnose failures" : "Open publish queue",
    },
    {
      label: "Render Blocked",
      value: buckets.approvedRenderBlocked.length,
      detail:
        buckets.approvedRenderBlocked.length > 0
          ? "Approved items missing render prerequisites"
          : "Render pipeline is clear",
      href: buckets.approvedRenderBlocked[0]
        ? `/shopreel/generations/${buckets.approvedRenderBlocked[0].generation.id}`
        : "/shopreel/render-queue",
      actionLabel: buckets.approvedRenderBlocked.length > 0 ? "Fix blockers" : "Open processing",
    },
  ];

  const prioritizedSources = [...storySources].sort((a, b) => {
    const aHasOpportunity = opportunityBySourceId.has(a.id);
    const bHasOpportunity = opportunityBySourceId.has(b.id);
    if (aHasOpportunity !== bHasOpportunity) return aHasOpportunity ? -1 : 1;
    const aTime = new Date(a.created_at ?? 0).getTime();
    const bTime = new Date(b.created_at ?? 0).getTime();
    return bTime - aTime;
  });

  const throughputSignals: ThroughputSignal[] = [
    {
      label: "Approval backlog",
      value: buckets.needsReview.length,
      detail:
        buckets.needsReview.length > 0 ? "Waiting for reviewer action now" : "No approvals waiting",
      href: "/shopreel/generations",
      tone: buckets.needsReview.length > 0 ? "copper" : "default",
    },
    {
      label: "Render blockers",
      value: buckets.approvedRenderBlocked.length,
      detail:
        buckets.approvedRenderBlocked.length > 0
          ? "Approved items blocked before publish"
          : "Render pipeline clear",
      href: "/shopreel/render-queue",
      tone: buckets.approvedRenderBlocked.length > 0 ? "muted" : "default",
    },
    {
      label: "Retryable publish failures",
      value: buckets.publishFailures.filter((item) => item.diagnostics.retryable).length,
      detail: "Requires retry or destination fixes",
      href: "/shopreel/publish-queue",
      tone: "muted",
    },
    {
      label: "Scheduled output",
      value: buckets.scheduled.length,
      detail: "Items queued on the calendar",
      href: "/shopreel/calendar",
      tone: "default",
    },
  ];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Operational Dashboard"
      subtitle="Priority-first command view for review, rendering, and publishing execution."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href={topCta.href}>
            <GlassButton variant="primary">{topCta.label}</GlassButton>
          </Link>
          <Link href="/shopreel/editor">
            <GlassButton variant="secondary">Open editor</GlassButton>
          </Link>
          <Link href="/shopreel/upload">
            <GlassButton variant="ghost">Manual upload</GlassButton>
          </Link>
        </div>
      }
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={cx(
              "block rounded-2xl border px-4 py-3 no-underline transition",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              "hover:border-white/20 hover:bg-white/[0.06]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={cx("text-[11px] uppercase tracking-[0.16em]", glassTheme.text.muted)}>
                  {kpi.label}
                </div>
                <div className={cx("mt-1 text-2xl font-semibold leading-none", glassTheme.text.primary)}>
                  {kpi.value}
                </div>
              </div>
              <div className={cx("text-[11px] font-medium uppercase tracking-wide", glassTheme.text.copper)}>
                {kpi.value === 0 ? "Watch" : "Act"}
              </div>
            </div>
            <div className={cx("mt-2 text-xs leading-5", glassTheme.text.secondary)}>{kpi.detail}</div>
            <div className={cx("mt-1 text-xs font-medium", glassTheme.text.copper)}>{kpi.actionLabel} →</div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <GlassCard
          label="Action Center"
          title="What should happen next"
          description="Urgent issues first, then highest-leverage work."
          strong
        >
          <div className="grid gap-2">
            {attentionItems.length > 0 ? (
              attentionItems.map((item) => (
                <div
                  key={item.key}
                  className={cx(
                    "grid gap-2 rounded-xl border px-3 py-2 md:grid-cols-[auto_1fr_auto] md:items-center",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft,
                  )}
                >
                  <GlassBadge tone={item.tone}>{item.priority === "urgent" ? "Urgent" : "High"}</GlassBadge>
                  <div className="min-w-0">
                    <div className={cx("truncate text-sm font-medium", glassTheme.text.primary)}>{item.title}</div>
                    <div className={cx("truncate text-xs", glassTheme.text.secondary)}>{item.summary}</div>
                  </div>
                  <Link href={item.href}>
                    <GlassButton variant="secondary">{item.actionLabel}</GlassButton>
                  </Link>
                </div>
              ))
            ) : (
              <div className="grid gap-2">
                {recommendedActions.slice(0, 3).map((item) => (
                  <div
                    key={item.key}
                    className={cx(
                      "grid gap-2 rounded-xl border px-3 py-2 md:grid-cols-[1fr_auto] md:items-center",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                    )}
                  >
                    <div>
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>{item.title}</div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>{item.summary}</div>
                    </div>
                    <Link href={item.href}>
                      <GlassButton variant="secondary">{item.actionLabel}</GlassButton>
                    </Link>
                  </div>
                ))}
                {recommendedActions.length === 0 ? (
                  <div
                    className={cx(
                      "rounded-xl border px-3 py-2 text-xs",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                      glassTheme.text.secondary,
                    )}
                  >
                    No urgent or recommended actions detected. Continue publishing from ready items.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard
          label="Ready Now"
          title="Immediate actions"
          description="Highest-value actions when no urgent blockers are active."
          strong
        >
          <div className="grid gap-2">
            {buckets.readyToPublish.slice(0, 4).map((generation) => (
              <div
                key={generation.id}
                className={cx("rounded-xl border px-3 py-2", glassTheme.border.copper, glassTheme.glass.panelSoft)}
              >
                <div className={cx("truncate text-sm font-medium", glassTheme.text.primary)}>
                  {generationTitle(generation)}
                </div>
                <div className={cx("text-xs", glassTheme.text.secondary)}>
                  Publish-ready • updated {timeAgoLabel(generation.updated_at ?? generation.created_at)}
                </div>
                <div className="mt-2">
                  <Link href={`/shopreel/generations/${generation.id}`}>
                    <GlassButton variant="primary">Open publish panel</GlassButton>
                  </Link>
                </div>
              </div>
            ))}

            {buckets.readyToPublish.length === 0 ? (
              <div className="grid gap-2">
                {recommendedActions.slice(0, 2).map((item) => (
                  <div
                    key={item.key}
                    className={cx(
                      "grid gap-2 rounded-xl border px-3 py-2 md:grid-cols-[1fr_auto] md:items-center",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                    )}
                  >
                    <div>
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>{item.title}</div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>{item.summary}</div>
                    </div>
                    <Link href={item.href}>
                      <GlassButton variant="secondary">{item.actionLabel}</GlassButton>
                    </Link>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <GlassCard
          label="Best New Inputs"
          title="Recent source activity"
          description="Fresh source material with one-click next action."
          strong
        >
          <div className="grid gap-2">
            {storySources.length === 0 ? (
              <div
                className={cx(
                  "rounded-xl border px-3 py-2 text-xs",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.secondary,
                )}
              >
                No recent source inputs. Add new material from Create.
              </div>
            ) : (
              prioritizedSources.map((source) => {
                const opportunityId = opportunityBySourceId.get(source.id) ?? null;
                const href = opportunityId ? `/shopreel/opportunities/${opportunityId}` : "/shopreel/create";
                const actionLabel = opportunityId ? "Open opportunity" : "Create opportunity";

                return (
                  <div
                    key={source.id}
                    className={cx(
                      "grid gap-2 rounded-xl border px-3 py-2 md:grid-cols-[auto_1fr_auto] md:items-center",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                    )}
                  >
                    <GlassBadge tone="default">{(source.kind ?? "source").replaceAll("_", " ")}</GlassBadge>
                    <div className="min-w-0">
                      <div className={cx("truncate text-sm font-medium", glassTheme.text.primary)}>
                        {source.title ?? "Untitled source"}
                      </div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>
                        {opportunityId ? "Opportunity ready" : "Needs opportunity"} • Added{" "}
                        {timeAgoLabel(source.created_at)}
                      </div>
                    </div>
                    <Link href={href}>
                      <GlassButton variant="ghost">{actionLabel}</GlassButton>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        <GlassCard
          label="Execution health"
          title="Throughput and operator controls"
          description="Live queue pressure plus immediate surface links."
          strong
        >
          <div className="grid gap-2">
            {throughputSignals.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cx(
                  "grid gap-1 rounded-xl border px-3 py-2 no-underline",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cx("text-sm", glassTheme.text.secondary)}>{item.label}</span>
                  <span className={cx("text-base font-semibold", glassTheme.text.primary)}>{item.value}</span>
                </div>
                <div
                  className={cx(
                    "text-xs",
                    item.tone === "copper"
                      ? glassTheme.text.copper
                      : item.tone === "muted"
                        ? glassTheme.text.copperSoft
                        : glassTheme.text.secondary,
                  )}
                >
                  {item.detail}
                </div>
              </Link>
            ))}

            <div
              className={cx(
                "grid gap-2 rounded-xl border px-3 py-3 md:grid-cols-2",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <Link href="/shopreel/editor">
                <GlassButton variant="secondary">Open editor hub</GlassButton>
              </Link>
              <Link href="/shopreel/upload">
                <GlassButton variant="ghost">Manual upload</GlassButton>
              </Link>
            </div>
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
