import { NextRequest, NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { runShopReelAutopilot } from "@/features/shopreel/automation/runShopReelAutopilot";

type AutopilotBody = {
  shopId?: string;
};

async function safeReadJson(req: NextRequest): Promise<AutopilotBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as AutopilotBody;
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

    const result = await runShopReelAutopilot(resolvedShopId);

    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Autopilot failed",
      },
      { status: 500 },
    );
  }
}
