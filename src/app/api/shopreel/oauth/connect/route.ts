import { NextRequest, NextResponse } from "next/server";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import type { ShopReelPlatform } from "@/features/shopreel/integrations/shared/types";

type Body = {
  shopId?: string;
  platform?: ShopReelPlatform;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;

  if (!body.shopId || !body.platform) {
    return NextResponse.json(
      { ok: false, error: "shopId and platform are required" },
      { status: 400 },
    );
  }

  const integration = getPlatformIntegration(body.platform);
  const result = await integration.startOAuth(body.shopId);

  return NextResponse.json(result);
}
