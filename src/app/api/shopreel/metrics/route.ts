import { NextRequest, NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { trackMetrics } from "@/features/shopreel/metrics/trackMetrics";
import { recordContentAnalytics } from "@/features/shopreel/metrics/recordContentAnalytics";
import { updateLearningSignals } from "@/features/shopreel/learning/updateLearningSignals";
import { updateMarketingMemory } from "@/features/shopreel/memory/updateMarketingMemory";

type Body = {
  shopId?: string;
  contentPieceId?: string;
  publicationId?: string | null;
  platform?: "instagram" | "facebook" | "tiktok" | "youtube" | "blog" | "linkedin" | "google_business" | "email";
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  leads?: number;
  bookings?: number;
  revenue?: number;
  watchTimeSeconds?: number;
  avgWatchSeconds?: number;
};

async function safeReadJson(req: NextRequest): Promise<Body> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as Body;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadJson(req);
    const resolvedShopId = await getCurrentShopId();

    if (typeof body.contentPieceId !== "string" || body.contentPieceId.length === 0) {
      return NextResponse.json(
        { ok: false, error: "contentPieceId is required" },
        { status: 400 },
      );
    }

    if (typeof body.platform !== "string" || body.platform.length === 0) {
      return NextResponse.json(
        { ok: false, error: "platform is required" },
        { status: 400 },
      );
    }

    if (
      typeof body.shopId === "string" &&
      body.shopId.length > 0 &&
      body.shopId !== resolvedShopId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "shopId override is not allowed for this endpoint.",
        },
        { status: 403 },
      );
    }

    const [metric, analytics, signals, memory] = await Promise.all([
      trackMetrics({
        shopId: resolvedShopId,
        contentPieceId: body.contentPieceId,
        platform: body.platform,
        views: body.views,
        impressions: body.impressions,
        likes: body.likes,
        comments: body.comments,
        shares: body.shares,
        saves: body.saves,
        clicks: body.clicks,
        leads: body.leads,
        bookings: body.bookings,
        revenue: body.revenue,
        watchTimeSeconds: body.watchTimeSeconds,
        avgWatchSeconds: body.avgWatchSeconds,
      }),
      recordContentAnalytics({
        shopId: resolvedShopId,
        contentPieceId: body.contentPieceId,
        publicationId: body.publicationId ?? null,
        platform: body.platform,
        views: body.views,
        likes: body.likes,
        shares: body.shares,
        comments: body.comments,
        saves: body.saves,
        clicks: body.clicks,
        leads: body.leads,
        bookings: body.bookings,
      }),
      updateLearningSignals(resolvedShopId),
      updateMarketingMemory(resolvedShopId),
    ]);

    return NextResponse.json({
      ok: true,
      metric,
      analytics,
      signals,
      memory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to record metrics",
      },
      { status: 500 },
    );
  }
}
