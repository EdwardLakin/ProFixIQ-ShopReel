import { NextResponse } from "next/server";
import { runAutomationLoop } from "@/features/shopreel/automation/runAutomationLoop";

export async function POST(req: Request) {
  const { shopId } = await req.json();

  if (!shopId) {
    return NextResponse.json({ error: "shopId required" }, { status: 400 });
  }

  const result = await runAutomationLoop(shopId);

  return NextResponse.json(result);
}
