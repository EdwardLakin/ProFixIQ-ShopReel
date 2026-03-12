import { NextResponse } from "next/server";
import { createOpportunities } from "@/features/shopreel/opportunities/createOpportunities";

export async function POST() {
  try {
    const result = await createOpportunities();

    return NextResponse.json({
      ok: true,
      opportunitiesCreated: result.created,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
