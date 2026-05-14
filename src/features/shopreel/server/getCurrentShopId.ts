import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";

type ShopIdRow = {
  shop_id: string;
};

type MinimalDbClient = {
  from: (table: string) => any;
};

async function ensureStandaloneShopReelWorkspace(
  admin: MinimalDbClient,
  user: { id: string; email?: string | null },
): Promise<string> {
  const workspaceId = user.id;

  const { data: existingSubscription } = await admin
    .from("shopreel_subscriptions")
    .select("shop_id")
    .eq("shop_id", workspaceId)
    .maybeSingle();

  if ((existingSubscription ?? null)?.shop_id) {
    return workspaceId;
  }

  const { error } = await admin.from("shopreel_subscriptions").insert({
    shop_id: workspaceId,
    plan: "personal_workspace",
    status: "active",
    metadata: {
      workspace_type: "personal",
      workspace_name: user.email ? `${user.email.split("@")[0]}'s Workspace` : "Personal Workspace",
      auto_created: true,
    },
  });

  if (error) {
    const message = String(error.message ?? "");
    if (!/duplicate key|already exists/i.test(message)) {
      throw error;
    }
  }

  return workspaceId;
}

async function resolveShopIdFromStandaloneShopReelData(
  admin: MinimalDbClient,
  userId?: string | null,
): Promise<string | null> {
  if (userId) {
    const { data: ownSubscriptionData } = await admin
      .from("shopreel_subscriptions")
      .select("shop_id")
      .eq("shop_id", userId)
      .maybeSingle();

    const ownSubscription = (ownSubscriptionData ?? null) as ShopIdRow | null;
    if (ownSubscription?.shop_id) return ownSubscription.shop_id;

    const { data: generationData } = await admin
      .from("shopreel_story_generations")
      .select("shop_id")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const generation = (generationData ?? null) as ShopIdRow | null;
    if (generation?.shop_id) return generation.shop_id;
  }

  return null;
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
    return ensureStandaloneShopReelWorkspace(admin, { id: user.id, email: user.email });
  }

  throw new ShopReelEndpointError("Shop context required", 401, "SHOP_CONTEXT_REQUIRED");
}
