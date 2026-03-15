import { createAdminClient, createClient } from "@/lib/supabase/server";

const DEFAULT_SHOP_ID =
  process.env.DEFAULT_SHOP_ID ?? "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

type ShopUserRow = {
  shop_id: string;
};

type ShopReelSettingsRow = {
  shop_id: string;
};

export async function getCurrentShopId(): Promise<string> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    const { data: membershipData } = await (admin as any)
      .from("shop_users")
      .select("shop_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const membership = (membershipData ?? null) as ShopUserRow | null;

    if (membership?.shop_id) {
      return membership.shop_id;
    }
  }

  const { data: settingsData } = await (admin as any)
    .from("shop_reel_settings")
    .select("shop_id")
    .order("shop_id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const settingsRow = (settingsData ?? null) as ShopReelSettingsRow | null;

  if (settingsRow?.shop_id) {
    return settingsRow.shop_id;
  }

  return DEFAULT_SHOP_ID;
}
