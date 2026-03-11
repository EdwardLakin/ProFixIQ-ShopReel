import { createClient } from "@/lib/supabase/server";

const DEFAULT_SHOP_ID = process.env.DEFAULT_SHOP_ID ?? "";

export async function getCurrentShopId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (DEFAULT_SHOP_ID) {
    return DEFAULT_SHOP_ID;
  }

  throw new Error("DEFAULT_SHOP_ID is not configured.");
}
