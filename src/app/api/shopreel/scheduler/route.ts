import { NextRequest, NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { queueScheduledContent } from "@/features/shopreel/scheduler/queueScheduledContent";

type Body = {
  shopId?: string;
  contentPieceId?: string;
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

    const result = await queueScheduledContent({
      shopId: resolvedShopId,
      contentPieceId:
        typeof body.contentPieceId === "string" && body.contentPieceId.length > 0
          ? body.contentPieceId
          : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to queue scheduled content",
      },
      { status: 500 },
    );
  }
}
