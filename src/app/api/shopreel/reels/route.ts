import { NextRequest, NextResponse } from "next/server";
import { buildReelPlan } from "@/features/shopreel/reels/buildReelPlan";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (typeof body.videoId !== "string" || body.videoId.length === 0) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  const shopId =
    typeof body.shopId === "string" && body.shopId.length > 0
      ? body.shopId
      : "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

  const result = await buildReelPlan(body.videoId, shopId);

  return NextResponse.json({ ok: true, result });
}
