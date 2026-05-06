import { createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export type ShopReelNotificationScope = {
  userId: string;
  shopId: string | null;
};

export async function getShopReelNotificationScope(): Promise<ShopReelNotificationScope> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.id) {
    throw new Error("Authentication required");
  }

  let shopId: string | null = null;
  try {
    shopId = await getCurrentShopId();
  } catch {
    shopId = null;
  }

  return {
    userId: authData.user.id,
    shopId,
  };
}
