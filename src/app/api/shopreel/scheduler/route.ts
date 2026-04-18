import { NextRequest, NextResponse } from "next/server";
import { queueScheduledContent } from "@/features/shopreel/scheduler/queueScheduledContent";
import {
  requireUserActionTenantContext,
  toEndpointErrorResponse,
} from "@/features/shopreel/server/endpointPolicy";

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
    const { shopId: resolvedShopId } = await requireUserActionTenantContext();

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
    return toEndpointErrorResponse(error, "Failed to queue scheduled content");
  }
}
