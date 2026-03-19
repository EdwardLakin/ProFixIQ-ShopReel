import { NextResponse } from "next/server";
import { processPremiumCampaignItem } from "@/features/shopreel/worker/processPremiumCampaignJobs";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("x-shopreel-worker-secret");
    if (!auth || auth !== process.env.SHOPREEL_PREMIUM_ASSEMBLY_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const itemId = String(body.itemId ?? "");

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "Missing itemId" }, { status: 400 });
    }

    const result = await processPremiumCampaignItem(itemId);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Worker failed" },
      { status: 500 }
    );
  }
}
