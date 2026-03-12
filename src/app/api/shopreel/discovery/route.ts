import { NextResponse } from "next/server";
import { discoverStorySources } from "@/features/shopreel/discovery/discoverStorySources";

export async function POST() {
  try {
    const result = await discoverStorySources();

    return NextResponse.json({
      ok: true,
      sourcesCreated: result.sourcesCreated,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Discovery failed";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
