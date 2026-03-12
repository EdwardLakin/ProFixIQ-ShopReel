import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { discoverStorySources } from "@/features/shopreel/discovery/discoverContent";
import { discoverStorySourceCandidates } from "@/features/shopreel/story-sources";
import { listStorySources } from "@/features/shopreel/story-sources/server";

export async function GET(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("mode") ?? "saved";
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 25;

    if (!Number.isFinite(limit) || limit <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid limit" },
        { status: 400 },
      );
    }

    if (mode === "discover") {
      const sources = await discoverStorySources(shopId);
      return NextResponse.json({
        ok: true,
        mode,
        count: Math.min(sources.length, limit),
        sources: sources.slice(0, limit),
      });
    }

    if (mode === "candidates") {
      const candidates = await discoverStorySourceCandidates(shopId);
      return NextResponse.json({
        ok: true,
        mode,
        count: Math.min(candidates.length, limit),
        candidates: candidates.slice(0, limit),
      });
    }

    const sources = await listStorySources({
      shopId,
      limit,
    });

    return NextResponse.json({
      ok: true,
      mode: "saved",
      count: sources.length,
      sources,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load story sources";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
