import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { withCanonicalApiHeaders } from "@/features/shopreel/server/apiOwnership";

type ShopUserLite = {
  shop_id: string;
};

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

async function resolveShopId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return DEFAULT_SHOP_ID;

  const admin = createAdminClient();
  const { data: membership } = await (admin as any)
    .from("shop_users")
    .select("shop_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (membership as ShopUserLite | null)?.shop_id ?? DEFAULT_SHOP_ID;
}

export async function GET() {
  try {
    const shopId = await resolveShopId();
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
    return withCanonicalApiHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    ));
  }
}
