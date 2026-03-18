import { NextResponse } from "next/server";
import { createOpportunities } from "@/features/shopreel/opportunities/createOpportunities";

export async function POST() {
  try {
    const result = await createOpportunities();

    return NextResponse.json({
      ok: true,
      opportunitiesCreated: Array.isArray(result) ? result.length : 0,
      opportunities: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate opportunities",
      },
      { status: 500 }
    );
  }
}
