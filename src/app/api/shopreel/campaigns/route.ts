import { NextResponse } from "next/server";
import { createCampaign } from "@/features/shopreel/campaigns/lib/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string;
      coreIdea?: string;
      audience?: string | null;
      offer?: string | null;
      campaignGoal?: string | null;
      platformFocus?: string[];
    };

    const campaignId = await createCampaign({
      title: body.title?.trim() || "Untitled Campaign",
      coreIdea: body.coreIdea?.trim() || "ShopReel marketing campaign",
      audience: body.audience ?? null,
      offer: body.offer ?? null,
      campaignGoal: body.campaignGoal ?? null,
      platformFocus: Array.isArray(body.platformFocus) ? body.platformFocus : [],
    });

    return NextResponse.json({
      ok: true,
      id: campaignId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}
