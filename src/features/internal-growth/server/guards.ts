import { ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export function assertGrowthAgentEnabled() {
  if (process.env.SHOPREEL_INTERNAL_GROWTH_AGENT_ENABLED !== "true") throw new ShopReelEndpointError("Internal growth agent is disabled", 404);
}

export async function requireGrowthAgentOwnerContext() {
  assertGrowthAgentEnabled();
  const supabase = await createClient();
  const admin = createAdminClient() as unknown as { from: (table: string) => any };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new ShopReelEndpointError("Authentication required", 401);
  const { data: row } = await admin.from("internal_growth_agent_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!row?.user_id) throw new ShopReelEndpointError("Owner/developer access required", 403);
  return { userId: user.id };
}
