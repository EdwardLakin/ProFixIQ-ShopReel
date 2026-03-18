import { NextResponse } from "next/server";
import { autoCreateCampaignsFromTopOpportunities } from "@/features/shopreel/opportunities/autoCreateCampaigns";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const minScore =
      typeof body.minScore === "number" ? body.minScore : 85;
    const limit =
      typeof body.limit === "number" ? body.limit : 3;

    const result = await autoCreateCampaignsFromTopOpportunities({
      minScore,
      limit,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to auto-create campaigns from opportunities",
      },
      { status: 500 }
    );
  }
}
