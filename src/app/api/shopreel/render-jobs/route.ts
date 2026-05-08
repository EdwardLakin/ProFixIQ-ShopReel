import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withCanonicalApiHeaders } from "@/features/shopreel/server/apiOwnership";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId") ?? await getCurrentShopId();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("reel_render_jobs")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return withCanonicalApiHeaders(NextResponse.json(
        { error: error.message },
        { status: 500 },
      ));
    }

    return withCanonicalApiHeaders(NextResponse.json({
      ok: true,
      jobs: data ?? [],
    }));
  } catch (error) {
    return withCanonicalApiHeaders(toEndpointErrorResponse(error, "Failed to load render jobs"));
  }
}
