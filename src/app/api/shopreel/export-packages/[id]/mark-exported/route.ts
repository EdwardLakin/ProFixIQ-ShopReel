import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireUserActionTenantContext, toEndpointErrorResponse, ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const { id } = await params;
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("shopreel_export_packages").update({ status: "exported", exported_at: new Date().toISOString() }).eq("id", id).eq("shop_id", shopId).select("id,status,exported_at").single();
    if (error || !data) throw new ShopReelEndpointError("Export package not found", 404);
    return NextResponse.json({ ok: true, item: data });
  } catch (error) { return toEndpointErrorResponse(error, "Failed to mark export package"); }
}
