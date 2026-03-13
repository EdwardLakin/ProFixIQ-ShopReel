import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { error } = await legacy
      .from("shopreel_content_opportunities")
      .delete()
      .eq("id", id)
      .eq("shop_id", shopId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      ok: true,
      deletedId: id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete opportunity";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
