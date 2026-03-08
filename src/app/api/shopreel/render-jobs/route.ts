import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId =
    searchParams.get("shopId") ?? "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reel_render_jobs")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    jobs: data ?? [],
  });
}
