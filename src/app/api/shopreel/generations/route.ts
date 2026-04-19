import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { listStoryGenerations } from "@/features/shopreel/story-sources/server";

export async function GET(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 25;

    if (!Number.isFinite(limit) || limit <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid limit" }, { status: 400 });
    }

    const generations = await listStoryGenerations({ shopId, limit });

    return NextResponse.json({
      ok: true,
      count: generations.length,
      generations,
      ownership: "canonical",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load generations";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
