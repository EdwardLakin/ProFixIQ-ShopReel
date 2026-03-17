import { createAdminClient } from "@/lib/supabase/server";
import { trackMetrics } from "@/features/shopreel/metrics/trackMetrics";
import { recordContentAnalytics } from "@/features/shopreel/metrics/recordContentAnalytics";

type PlatformAccountRow = {
  id: string;
  tenant_shop_id: string;
  platform: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  metadata: Record<string, unknown> | null;
};

type PublicationRow = {
  id: string;
  tenant_shop_id: string;
  content_piece_id: string | null;
  platform_account_id: string | null;
  platform: string | null;
  platform_post_id: string | null;
  metadata: Record<string, unknown> | null;
};

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function fetchMetaMetrics(input: {
  platformPostId: string;
  accessToken: string;
}) {
  const url =
    `https://graph.facebook.com/v21.0/${encodeURIComponent(input.platformPostId)}` +
    `?fields=insights.metric(post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total,post_clicks),shares,comments.summary(true)` +
    `&access_token=${encodeURIComponent(input.accessToken)}`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(
      typeof safeObject(json.error).message === "string"
        ? String(safeObject(json.error).message)
        : "Failed to fetch Meta metrics",
    );
  }

  const insights = Array.isArray((json as { insights?: { data?: unknown[] } }).insights?.data)
    ? ((json as { insights?: { data?: unknown[] } }).insights?.data as Array<Record<string, unknown>>)
    : [];

  const metricValue = (name: string) => {
    const row = insights.find((item) => item.name === name);
    const values = Array.isArray(row?.values) ? (row?.values as Array<Record<string, unknown>>) : [];
    return Number(values[0]?.value ?? 0);
  };

  const commentsSummary = safeObject((json as { comments?: unknown }).comments);
  const shares = Number(safeObject(json.shares).count ?? 0);

  return {
    views: metricValue("post_impressions_unique"),
    impressions: metricValue("post_impressions"),
    likes: 0,
    comments: Number(safeObject(commentsSummary.summary).total_count ?? 0),
    shares,
    saves: 0,
    clicks: metricValue("post_clicks"),
  };
}

async function fetchYouTubeMetrics(input: {
  videoId: string;
  accessToken: string;
}) {
  const url =
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${encodeURIComponent(input.videoId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error("Failed to fetch YouTube metrics");
  }

  const items = Array.isArray(json.items) ? (json.items as Array<Record<string, unknown>>) : [];
  const stats = safeObject(items[0]?.statistics);

  return {
    views: Number(stats.viewCount ?? 0),
    impressions: Number(stats.viewCount ?? 0),
    likes: Number(stats.likeCount ?? 0),
    comments: Number(stats.commentCount ?? 0),
    shares: 0,
    saves: 0,
    clicks: 0,
  };
}

async function fetchTikTokMetrics(input: {
  publication: PublicationRow;
  account: PlatformAccountRow;
}) {
  const metadata = safeObject(input.publication.metadata);
  const fallbackViews = Number(metadata.views ?? 0);

  return {
    views: fallbackViews,
    impressions: fallbackViews,
    likes: Number(metadata.likes ?? 0),
    comments: Number(metadata.comments ?? 0),
    shares: Number(metadata.shares ?? 0),
    saves: Number(metadata.saves ?? 0),
    clicks: Number(metadata.clicks ?? 0),
  };
}

export async function syncPlatformMetrics(shopId: string) {
  const supabase = createAdminClient();

  const { data: publications, error: publicationsError } = await supabase
    .from("content_publications")
    .select("id, tenant_shop_id, content_piece_id, platform_account_id, platform, platform_post_id, metadata")
    .eq("tenant_shop_id", shopId)
    .eq("status", "published")
    .not("platform_post_id", "is", null)
    .order("published_at", { ascending: false })
    .limit(50);

  if (publicationsError) {
    throw new Error(publicationsError.message);
  }

  const publicationRows = (publications ?? []) as PublicationRow[];
  if (publicationRows.length === 0) {
    return { ok: true, synced: 0, skipped: 0 };
  }

  const accountIds = publicationRows
    .map((row) => row.platform_account_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  const { data: accounts, error: accountsError } = await supabase
    .from("content_platform_accounts")
    .select("id, tenant_shop_id, platform, access_token, refresh_token, token_expires_at, metadata")
    .in("id", accountIds);

  if (accountsError) {
    throw new Error(accountsError.message);
  }

  const accountById = new Map<string, PlatformAccountRow>();
  for (const account of (accounts ?? []) as PlatformAccountRow[]) {
    accountById.set(account.id, account);
  }

  let synced = 0;
  let skipped = 0;

  for (const publication of publicationRows) {
    if (!publication.content_piece_id || !publication.platform_account_id || !publication.platform) {
      skipped += 1;
      continue;
    }

    const account = accountById.get(publication.platform_account_id);
    if (!account) {
      skipped += 1;
      continue;
    }

    try {
      let metrics:
        | {
            views: number;
            impressions: number;
            likes: number;
            comments: number;
            shares: number;
            saves: number;
            clicks: number;
          }
        | null = null;

      if (
        (publication.platform === "instagram" || publication.platform === "facebook") &&
        account.access_token &&
        publication.platform_post_id
      ) {
        metrics = await fetchMetaMetrics({
          platformPostId: publication.platform_post_id,
          accessToken: account.access_token,
        });
      } else if (
        publication.platform === "youtube" &&
        account.access_token &&
        publication.platform_post_id
      ) {
        metrics = await fetchYouTubeMetrics({
          videoId: publication.platform_post_id,
          accessToken: account.access_token,
        });
      } else if (publication.platform === "tiktok") {
        metrics = await fetchTikTokMetrics({
          publication,
          account,
        });
      }

      if (!metrics) {
        skipped += 1;
        continue;
      }

      await Promise.all([
        trackMetrics({
          shopId,
          contentPieceId: publication.content_piece_id,
          platform: publication.platform,
          views: metrics.views,
          impressions: metrics.impressions,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          saves: metrics.saves,
          clicks: metrics.clicks,
        }),
        recordContentAnalytics({
          shopId,
          contentPieceId: publication.content_piece_id,
          publicationId: publication.id,
          platform: publication.platform as
            | "instagram"
            | "facebook"
            | "tiktok"
            | "youtube"
            | "blog"
            | "linkedin"
            | "google_business"
            | "email",
          views: metrics.views,
          likes: metrics.likes,
          shares: metrics.shares,
          comments: metrics.comments,
          saves: metrics.saves,
          clicks: metrics.clicks,
        }),
      ]);

      synced += 1;
    } catch (error) {
      console.error("[syncPlatformMetrics] failed", {
        publicationId: publication.id,
        platform: publication.platform,
        error,
      });
      skipped += 1;
    }
  }

  return {
    ok: true,
    synced,
    skipped,
  };
}
