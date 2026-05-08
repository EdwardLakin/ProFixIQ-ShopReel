import { NextRequest, NextResponse } from "next/server";
import { buildReelPlan } from "@/features/shopreel/reels/buildReelPlan";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (typeof body.videoId !== "string" || body.videoId.length === 0) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const shopId =
      typeof body.shopId === "string" && body.shopId.length > 0
        ? body.shopId
        : await getCurrentShopId();

    const result = await buildReelPlan(body.videoId, shopId);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to build reel plan");
  }
}
