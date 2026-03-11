import { createClient } from "@/lib/supabase/server";

const DEFAULT_SHOP_ID = process.env.DEFAULT_SHOP_ID ?? "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

export async function getCurrentShopId(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SHOP_ID;
  }

  const { data: settingsRow } = await supabase
    .from("shop_reel_settings")
    .select("shop_id")
    .limit(1)
    .maybeSingle();

  if (settingsRow?.shop_id) {
    return settingsRow.shop_id;
  }

  return DEFAULT_SHOP_ID;
}
