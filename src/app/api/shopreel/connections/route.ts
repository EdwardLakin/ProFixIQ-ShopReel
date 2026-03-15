import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function GET() {
  try {
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();

    const { data, error } = await (supabase as any)
      .from("content_platform_accounts")
      .select(
        `
        id,
        platform,
        connection_active,
        account_label,
        platform_account_id,
        platform_username,
        token_expires_at,
        updated_at,
        metadata
      `,
      )
      .eq("tenant_shop_id", shopId)
      .order("platform", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      ok: true,
      connections: data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load connections",
      },
      { status: 500 },
    );
  }
}
