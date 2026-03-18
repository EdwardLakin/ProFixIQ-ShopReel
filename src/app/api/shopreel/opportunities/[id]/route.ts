import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { suppressStorySource } from "@/features/shopreel/opportunities/lib/suppressStorySource";

type DB = Database;

const supabase = createClient<DB>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        error: error instanceof Error ? error.message : "Failed to update opportunity",
      },
      { status: 500 }
    );
  }
}
