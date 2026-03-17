import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: publication, error: lookupError } = await legacy
      .from("content_publications")
      .select("id, content_piece_id, tenant_shop_id, source_shop_id")
      .eq("id", id)
      .or(`tenant_shop_id.eq.${shopId},source_shop_id.eq.${shopId}`)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (!publication) {
      return NextResponse.json(
        { ok: false, error: "Publication not found" },
        { status: 404 }
      );
    }

    await legacy
      .from("shopreel_publish_jobs")
      .delete()
      .eq("publication_id", id)
      .eq("shop_id", shopId);

    const { error: deleteError } = await legacy
      .from("content_publications")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({
      ok: true,
      deletedId: id,
      contentPieceId: publication.content_piece_id ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete publication",
      },
      { status: 500 }
    );
  }
}
