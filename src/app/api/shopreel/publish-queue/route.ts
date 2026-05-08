import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withCanonicalApiHeaders } from "@/features/shopreel/server/apiOwnership";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET() {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("shopreel_publish_jobs")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return withCanonicalApiHeaders(NextResponse.json({ error: error.message }, { status: 500 }));
    }

    return withCanonicalApiHeaders(NextResponse.json({ ok: true, items: data ?? [] }));
  } catch (error) {
    return withCanonicalApiHeaders(toEndpointErrorResponse(error, "Failed to load publish queue"));
  }
}
