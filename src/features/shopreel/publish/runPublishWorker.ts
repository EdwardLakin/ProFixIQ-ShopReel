import { createAdminClient } from "@/lib/supabase/server";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import type {
  PublishInput,
  PublishResult,
  ShopReelPlatform,
} from "@/features/shopreel/integrations/shared/types";

type ContentPieceRow = {
  id: string;
  tenant_shop_id: string;
  title: string | null;
  caption: string | null;
};

type ContentAssetRow = {
  id: string;
  file_url: string | null;
  public_url: string | null;
  asset_url: string | null;
  url: string | null;
};

type ConnectedPlatformRow = {
  platform: string | null;
};

type SuccessfulPublish = {
  platform: ShopReelPlatform;
  result: PublishResult;
};

const AUTO_PUBLISH_PLATFORMS: ShopReelPlatform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
];

function isAutoPublishPlatform(value: string | null): value is ShopReelPlatform {
  return (
    value === "facebook" ||
    value === "instagram" ||
    value === "tiktok" ||
    value === "youtube"
  );
}

async function getConnectedPlatforms(shopId: string): Promise<ShopReelPlatform[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_platform_accounts")
    .select("platform")
    .eq("tenant_shop_id", shopId)
    .eq("connection_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ConnectedPlatformRow[];
  const unique = new Set<ShopReelPlatform>();

  for (const row of rows) {
    if (
      isAutoPublishPlatform(row.platform) &&
      AUTO_PUBLISH_PLATFORMS.includes(row.platform)
    ) {
      unique.add(row.platform);
    }
  }

  return Array.from(unique);
}

function pickVideoUrl(asset: ContentAssetRow | null): string | null {
  if (!asset) return null;

  return asset.public_url ?? asset.file_url ?? asset.asset_url ?? asset.url ?? null;
}

export async function runPublishWorker(contentPieceId?: string | null) {
  const supabase = createAdminClient();

  let query = supabase
    .from("content_pieces")
    .select("id, tenant_shop_id, title, caption")
    .eq("status", "ready")
    .limit(25);

  if (contentPieceId) {
    query = query.eq("id", contentPieceId);
  }

  const { data: ready, error: readyError } = await query;

  if (readyError) {
    throw new Error(readyError.message);
  }

  const items = (ready ?? []) as ContentPieceRow[];

  if (items.length === 0) {
    return { published: 0, attempted: 0, failed: 0 };
  }

  let published = 0;
  let attempted = 0;
  let failed = 0;

  for (const item of items) {
    attempted += 1;

    await supabase
      .from("content_calendar_items")
      .update({ status: "publishing" })
      .eq("content_piece_id", item.id);

    const { data: assetData, error: assetError } = await supabase
      .from("content_assets")
      .select("id, file_url, public_url, asset_url, url")
      .eq("content_piece_id", item.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (assetError) {
      await supabase
        .from("content_calendar_items")
        .update({ status: "failed_publish" })
        .eq("content_piece_id", item.id);

      failed += 1;
      continue;
    }

    const asset = (assetData ?? null) as ContentAssetRow | null;
    const videoUrl = pickVideoUrl(asset);

    if (!videoUrl) {
      await supabase
        .from("content_calendar_items")
        .update({ status: "failed_publish" })
        .eq("content_piece_id", item.id);

      failed += 1;
      continue;
    }

    const targets = await getConnectedPlatforms(item.tenant_shop_id);

    if (targets.length === 0) {
      await supabase
        .from("content_calendar_items")
        .update({ status: "failed_publish" })
        .eq("content_piece_id", item.id);

      failed += 1;
      continue;
    }

    const settled = await Promise.allSettled(
      targets.map(async (platform) => {
        const integration = getPlatformIntegration(platform);

        const payload: PublishInput = {
          shopId: item.tenant_shop_id,
          platform,
          title: item.title ?? "ShopReel Post",
          caption: item.caption ?? item.title ?? null,
          videoUrl,
          contentPieceId: item.id,
          contentAssetId: asset?.id ?? null,
        };

        return integration.publishVideo(payload);
      }),
    );

    const successes: SuccessfulPublish[] = [];

    for (let i = 0; i < settled.length; i += 1) {
      const entry = settled[i];
      const platform = targets[i];

      if (entry.status === "fulfilled" && entry.value.ok) {
        successes.push({
          platform,
          result: entry.value,
        });
      }
    }

    for (const success of successes) {
      const { error: publicationInsertError } = await supabase
        .from("content_publications")
        .insert({
          tenant_shop_id: item.tenant_shop_id,
          source_shop_id: item.tenant_shop_id,
          content_piece_id: item.id,
          platform: success.platform,
          status: success.result.status,
          remote_post_id: success.result.remotePostId,
          remote_post_url: success.result.remotePostUrl ?? null,
          published_at: new Date().toISOString(),
        } as never);

      if (publicationInsertError) {
        throw new Error(publicationInsertError.message);
      }
    }

    if (successes.length > 0) {
      await supabase
        .from("content_pieces")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      await supabase
        .from("content_calendar_items")
        .update({ status: "published" })
        .eq("content_piece_id", item.id);

      published += 1;
    } else {
      await supabase
        .from("content_calendar_items")
        .update({ status: "failed_publish" })
        .eq("content_piece_id", item.id);

      failed += 1;
    }
  }

  return {
    published,
    attempted,
    failed,
  };
}
