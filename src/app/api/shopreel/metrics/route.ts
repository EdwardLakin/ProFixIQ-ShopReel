import { NextRequest, NextResponse } from "next/server";
import { trackMetrics } from "@/features/shopreel/metrics/trackMetrics";

type MetricsBody = {
  contentPieceId?: string;
  platform?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  leads?: number;
  bookings?: number;
};

async function safeReadJson(req: NextRequest): Promise<MetricsBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as MetricsBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const body = await safeReadJson(req);

  if (typeof body.contentPieceId !== "string" || typeof body.platform !== "string") {
    return NextResponse.json(
      { error: "contentPieceId and platform are required" },
      { status: 400 },
    );
  }

  const result = await trackMetrics({
    contentPieceId: body.contentPieceId,
    platform: body.platform,
    views: body.views,
    likes: body.likes,
    comments: body.comments,
    shares: body.shares,
    saves: body.saves,
    clicks: body.clicks,
    leads: body.leads,
    bookings: body.bookings,
  });

  return NextResponse.json({
    ok: true,
    result,
  });
}
