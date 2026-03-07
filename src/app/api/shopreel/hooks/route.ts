import { NextRequest, NextResponse } from "next/server";
import { generateViralHooks } from "@/features/shopreel/hooks/generateViralHooks";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const subject =
    typeof body.subject === "string" && body.subject.length > 0
      ? body.subject
      : "repair job";
  const contentType =
    typeof body.contentType === "string" && body.contentType.length > 0
      ? body.contentType
      : "repair_story";

  const hooks = await generateViralHooks(subject, contentType);

  return NextResponse.json({ ok: true, hooks });
}
