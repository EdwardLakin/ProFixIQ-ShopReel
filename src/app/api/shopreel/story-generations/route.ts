import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { listStoryGenerations } from "@/features/shopreel/story-sources/server";
import { withDeprecatedApiHeaders } from "@/features/shopreel/server/apiOwnership";

export async function GET(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 25;

    if (!Number.isFinite(limit) || limit <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid limit" },
        { status: 400 },
      );
    }

    const generations = await listStoryGenerations({
      shopId,
      limit,
    });

    return withDeprecatedApiHeaders(NextResponse.json({
      ok: true,
      count: generations.length,
      generations,
    }), "/api/shopreel/generations", "Use /generations as the canonical family.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load story generations";

    return withDeprecatedApiHeaders(NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    ), "/api/shopreel/generations");
  }
}
