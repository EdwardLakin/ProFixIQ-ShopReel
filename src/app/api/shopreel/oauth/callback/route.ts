import { NextRequest, NextResponse } from "next/server";
import { getPlatformIntegration } from "@/features/shopreel/integrations/shared/platformRegistry";
import type { ShopReelPlatform } from "@/features/shopreel/integrations/shared/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get("shopId");
  const platform = searchParams.get("platform") as ShopReelPlatform | null;
  const code = searchParams.get("code");

  if (!shopId || !platform || !code) {
    return NextResponse.json(
      { ok: false, error: "shopId, platform, and code are required" },
      { status: 400 },
    );
  }

  const integration = getPlatformIntegration(platform);
  const result = await integration.finishOAuth(shopId, code);

  return NextResponse.json(result);
}
