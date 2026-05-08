import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";

type ShopIdRow = {
  shop_id: string;
};

async function resolveShopIdFromStandaloneShopReelData(admin: unknown, userId?: string | null): Promise<string | null> {
  const db = admin as { from: (table: string) => any };

  if (userId) {
    const { data: generationData } = await db
      .from("shopreel_story_generations")
      .select("shop_id")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const generation = (generationData ?? null) as ShopIdRow | null;
    if (generation?.shop_id) return generation.shop_id;
  }

  const { data: subscriptionData } = await db
    .from("shopreel_subscriptions")
    .select("shop_id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscription = (subscriptionData ?? null) as ShopIdRow | null;
  if (subscription?.shop_id) return subscription.shop_id;

  const { data: generationFallbackData } = await db
    .from("shopreel_story_generations")
    .select("shop_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const generationFallback = (generationFallbackData ?? null) as ShopIdRow | null;
  return generationFallback?.shop_id ?? null;
}

export async function getCurrentShopId(): Promise<string> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shopId = await resolveShopIdFromStandaloneShopReelData(admin, user?.id ?? null);

  if (shopId) {
    return shopId;
  }

  if (user?.id) {
    throw new ShopReelEndpointError("Active ShopReel workspace is required", 403, "FORBIDDEN");
  }

  throw new ShopReelEndpointError("Shop context required", 401, "SHOP_CONTEXT_REQUIRED");
}
