import { createAdminClient } from "@/lib/supabase/server";
import { ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";

type ShopReelSettingsRow = {
  shop_id: string;
};

export async function getCurrentShopId(): Promise<string> {
  const admin = createAdminClient();

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

  throw new ShopReelEndpointError("Shop context required", 401, "SHOP_CONTEXT_REQUIRED");
}
