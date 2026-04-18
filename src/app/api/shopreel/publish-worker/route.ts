import { NextRequest, NextResponse } from "next/server";
import { runPublishWorker } from "@/features/shopreel/publish/runPublishWorker";
import {
  requireUserActionTenantContext,
  toEndpointErrorResponse,
} from "@/features/shopreel/server/endpointPolicy";

type Body = {
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
    const { shopId } = await requireUserActionTenantContext();
    const body = await safeReadJson(req);

    const result = await runPublishWorker({
      shopId,
      contentPieceId:
        typeof body.contentPieceId === "string" && body.contentPieceId.length > 0
          ? body.contentPieceId
          : null,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to run publish worker");
  }
}
