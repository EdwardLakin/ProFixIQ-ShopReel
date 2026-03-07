import { NextRequest, NextResponse } from "next/server";
import { publishVideo } from "@/features/shopreel/publish/publishVideo";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await publishVideo(body.videoId, body.platform);

  return NextResponse.json({
    ok: true,
    result
  });
}