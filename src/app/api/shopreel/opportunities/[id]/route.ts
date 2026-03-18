import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const nextStatus =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "dismissed";

    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data, error } = await supabase
      .from("shopreel_content_opportunities")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("shop_id", shopId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update opportunity");
    }

    return NextResponse.json({
      ok: true,
      opportunity: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update opportunity",
      },
      { status: 500 }
    );
  }
}
