import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const supabase = await createClient();

  await supabase.from("video_metrics").insert(body);

  return NextResponse.json({ ok: true });
}