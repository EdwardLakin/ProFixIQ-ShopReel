import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: false,
    error: "Deprecated endpoint. Use /api/shopreel/render-worker.",
    canonicalEndpoint: "/api/shopreel/render-worker",
  }, {
    status: 410,
  });
}
