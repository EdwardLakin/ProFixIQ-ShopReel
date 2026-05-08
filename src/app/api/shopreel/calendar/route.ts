import { NextRequest, NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";
import { generateContentCalendar } from "@/features/shopreel/calendar/generateContentCalendar";

type CalendarRequestBody = {
  shopId?: string;
};

async function safeReadJson(req: NextRequest): Promise<CalendarRequestBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as CalendarRequestBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadJson(req);
    const shopId =
      typeof body.shopId === "string" && body.shopId.length > 0
        ? body.shopId
        : await getCurrentShopId();
    const result = await generateContentCalendar(shopId);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to generate calendar");
  }
}
