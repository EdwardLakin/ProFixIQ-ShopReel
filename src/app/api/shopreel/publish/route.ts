import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import type {
  PublishInput,
  ShopReelPlatform,
} from "@/features/shopreel/integrations/shared/types";

type Body = PublishInput & {
  platform?: ShopReelPlatform;
};

type ConnectedPlatformRow = {
  platform: string | null;
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
    if (isAutoPublishPlatform(row.platform) && AUTO_PUBLISH_PLATFORMS.includes(row.platform)) {
      unique.add(row.platform);
    }
  }

  return Array.from(unique);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    if (!body.shopId || !body.title || !body.videoUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "shopId, title, and videoUrl are required",
        },
        { status: 400 },
      );
    }

    // Manual single-platform publish still works.
    if (body.platform) {
      const integration = getPlatformIntegration(body.platform);
      const result = await integration.publishVideo(body);
      return NextResponse.json(result);
    }

    // Automatic publish to all connected supported platforms.
    const targets = await getConnectedPlatforms(body.shopId);

    if (targets.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No connected publish platforms found for this shop.",
        },
        { status: 400 },
      );
    }

    const settled = await Promise.allSettled(
      targets.map(async (platform) => {
        const integration = getPlatformIntegration(platform);

        const result = await integration.publishVideo({
          ...body,
          platform,
        });

        return {
          ...result,
        };
      }),
    );

    const results = settled.map((entry, index) => ({
      platform: targets[index],
      ok: entry.status === "fulfilled" ? entry.value.ok : false,
      result: entry.status === "fulfilled" ? entry.value : null,
      error:
        entry.status === "rejected"
          ? entry.reason instanceof Error
            ? entry.reason.message
            : "Unknown publish error"
          : null,
    }));

    const anySuccess = results.some((item) => item.ok);

    return NextResponse.json({
      ok: anySuccess,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected publish error",
      },
      { status: 500 },
    );
  }
}