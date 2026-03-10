import { NextRequest, NextResponse } from "next/server";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import type {
  PublishInput,
  ShopReelPlatform,
} from "@/features/shopreel/integrations/shared/types";

type Body = PublishInput & {
  platform?: ShopReelPlatform;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    if (!body.shopId || !body.platform || !body.title || !body.videoUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "shopId, platform, title, and videoUrl are required",
        },
        { status: 400 },
      );
    }

    const integration = getPlatformIntegration(body.platform);
    const result = await integration.publishVideo(body);

    return NextResponse.json(result);
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