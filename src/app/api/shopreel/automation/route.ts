import { NextRequest, NextResponse } from "next/server";
import { runAutomationLoop } from "@/features/shopreel/automation/runAutomationLoop";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type Body = {
  shopId?: string;
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

    const result = await runAutomationLoop(resolvedShopId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run automation loop",
      },
      { status: 500 },
    );
  }
}
