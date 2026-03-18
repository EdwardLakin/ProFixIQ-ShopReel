import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";

export default async function ShopReelAnalyticsPage() {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const [
    publicationsRes,
    analyticsEventsRes,
    contentPiecesRes,
    signalsRes,
    campaignAnalyticsRes,
  ] = await Promise.all([
    supabase
      .from("content_publications")
      .select("id, status, platform, content_piece_id, published_at, created_at")
      .eq("tenant_shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(200),

    supabase
      .from("content_analytics_events")
      .select("id, event_name, event_value, platform, publication_id, content_piece_id, occurred_at")
      .eq("tenant_shop_id", shopId)
      .order("occurred_at", { ascending: false })
      .limit(500),

    supabase
      .from("content_pieces")
      .select("id, title, content_type, status, created_at, published_at")
      .eq("tenant_shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(200),

    supabase
      .from("shop_content_signals")
      .select("*")
      .eq("shop_id", shopId)
      .order("total_views", { ascending: false })
      .limit(12),

    supabase
      .from("shopreel_campaign_analytics")
      .select("*")
      .eq("shop_id", shopId)
      .order("updated_at", { ascending: false })
      .limit(12),
  ]);

  for (const res of [
    publicationsRes,
    analyticsEventsRes,
    contentPiecesRes,
    signalsRes,
    campaignAnalyticsRes,
  ]) {
    if (res.error) throw new Error(res.error.message);
  }

  const publications = publicationsRes.data ?? [];
  const analyticsEvents = analyticsEventsRes.data ?? [];
  const contentPieces = contentPiecesRes.data ?? [];
  const signals = signalsRes.data ?? [];
  const campaignAnalytics = campaignAnalyticsRes.data ?? [];

  const totalViews = analyticsEvents
    .filter((row) => row.event_name.toLowerCase().includes("view"))
    .reduce((sum, row) => sum + Number(row.event_value ?? 0), 0);

  const totalEngagement = analyticsEvents
    .filter((row) =>
      ["like", "comment", "share", "save", "engagement"].some((key) =>
        row.event_name.toLowerCase().includes(key)
      )
    )
    .reduce((sum, row) => sum + Number(row.event_value ?? 0), 0);

  const publishedCount = publications.filter((row) => row.status === "published").length;
  const avgViewsPerPublication =
    publishedCount > 0 ? Math.round(totalViews / publishedCount) : 0;

  const platformTotals = ["instagram", "facebook", "tiktok", "youtube"].map((platform) => {
    const platformPublications = publications.filter((row) => row.platform === platform);
    const platformIds = platformPublications.map((row) => row.id);

    const platformViews = analyticsEvents
      .filter(
        (row) =>
          row.platform === platform ||
          (row.publication_id ? platformIds.includes(row.publication_id) : false)
      )
      .filter((row) => row.event_name.toLowerCase().includes("view"))
      .reduce((sum, row) => sum + Number(row.event_value ?? 0), 0);

    return {
      platform,
      publications: platformPublications.length,
      views: platformViews,
    };
  });

  const bestContentType =
    signals.sort((a, b) => Number(b.total_views ?? 0) - Number(a.total_views ?? 0))[0] ?? null;

  const winningCampaign =
    campaignAnalytics.sort(
      (a, b) => Number(b.total_engagement ?? 0) - Number(a.total_engagement ?? 0)
    )[0] ?? null;

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Analytics"
      subtitle="Real performance data from publications, analytics events, content signals, and campaigns."
    >
      <ShopReelNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard label="Views" title="Total views" strong>
          <div className={cx("text-3xl font-semibold", glassTheme.text.primary)}>
            {totalViews.toLocaleString()}
          </div>
        </GlassCard>

        <GlassCard label="Engagement" title="Total engagement" strong>
          <div className={cx("text-3xl font-semibold", glassTheme.text.primary)}>
            {totalEngagement.toLocaleString()}
          </div>
        </GlassCard>

        <GlassCard label="Publishing" title="Published pieces" strong>
          <div className={cx("text-3xl font-semibold", glassTheme.text.primary)}>
            {publishedCount}
          </div>
        </GlassCard>

        <GlassCard label="Average" title="Avg views / publication" strong>
          <div className={cx("text-3xl font-semibold", glassTheme.text.primary)}>
            {avgViewsPerPublication.toLocaleString()}
          </div>
        </GlassCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="Channels"
          title="Platform performance"
          description="Real publication and view totals by platform."
          strong
        >
          <div className="grid gap-3">
            {platformTotals.map((row) => (
              <div
                key={row.platform}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={cx("text-base font-medium capitalize", glassTheme.text.primary)}>
                    {row.platform}
                  </div>
                  <GlassBadge tone="default">{row.publications} publications</GlassBadge>
                </div>
                <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                  {row.views.toLocaleString()} views
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="Signals"
          title="Best-performing content type"
          description="Derived from shop content signals."
          strong
        >
          {!bestContentType ? (
            <div className={cx("text-sm", glassTheme.text.secondary)}>
              No signal data yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className={cx("text-2xl font-semibold", glassTheme.text.primary)}>
                {bestContentType.content_type}
              </div>
              <div className="flex flex-wrap gap-2">
                <GlassBadge tone="copper">
                  {Number(bestContentType.total_views ?? 0).toLocaleString()} views
                </GlassBadge>
                <GlassBadge tone="muted">
                  {Number(bestContentType.total_posts ?? 0)} posts
                </GlassBadge>
              </div>
              <div className={cx("text-sm", glassTheme.text.secondary)}>
                Avg engagement score: {Number(bestContentType.avg_engagement_score ?? 0).toFixed(2)}
              </div>
            </div>
          )}
        </GlassCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="Campaigns"
          title="Top campaign outcome"
          description="Winning angle and totals from recent campaign analytics."
          strong
        >
          {!winningCampaign ? (
            <div className={cx("text-sm", glassTheme.text.secondary)}>
              No campaign analytics yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className={cx("text-base font-medium", glassTheme.text.primary)}>
                Winning angle: {winningCampaign.winning_angle ?? "No winner yet"}
              </div>
              <div className="flex flex-wrap gap-2">
                <GlassBadge tone="default">
                  {Number(winningCampaign.total_views ?? 0).toLocaleString()} views
                </GlassBadge>
                <GlassBadge tone="copper">
                  {Number(winningCampaign.total_engagement ?? 0).toLocaleString()} engagement
                </GlassBadge>
              </div>
              <div className={cx("text-sm", glassTheme.text.secondary)}>
                {winningCampaign.total_published} published items across {winningCampaign.total_items} campaign items
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard
          label="Content"
          title="Recent content pipeline"
          description="Latest content pieces flowing through ShopReel."
          strong
        >
          <div className="grid gap-3">
            {contentPieces.slice(0, 8).map((piece) => (
              <div
                key={piece.id}
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                  {piece.title}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <GlassBadge tone="default">{piece.status}</GlassBadge>
                  {piece.content_type ? (
                    <GlassBadge tone="muted">{piece.content_type}</GlassBadge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
