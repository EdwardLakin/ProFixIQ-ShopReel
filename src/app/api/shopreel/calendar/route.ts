import { NextRequest, NextResponse } from "next/server";
import { generateContentCalendar } from "@/features/shopreel/calendar/generateContentCalendar";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const shopId =
    typeof body.shopId === "string" && body.shopId.length > 0
      ? body.shopId
      : "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

  const result = await generateContentCalendar(shopId);

  return NextResponse.json({ ok: true, result });
}
