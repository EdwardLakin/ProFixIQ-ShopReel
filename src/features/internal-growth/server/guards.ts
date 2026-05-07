import { ShopReelEndpointError } from "@/features/shopreel/server/endpointPolicy";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { GrowthEngineScopeType } from "./types";

export function assertGrowthAgentEnabled() {
  if (process.env.SHOPREEL_INTERNAL_GROWTH_AGENT_ENABLED !== "true") throw new ShopReelEndpointError("Internal growth agent is disabled", 404);
}

export async function assertInternalGrowthAccess() {
  assertGrowthAgentEnabled();
  const supabase = await createClient();
  const admin = createAdminClient() as unknown as { from: (table: string) => any };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new ShopReelEndpointError("Authentication required", 401);
  const { data: row } = await admin.from("internal_growth_agent_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!row?.user_id) throw new ShopReelEndpointError("Owner/developer access required", 403);
  return { userId: user.id };
}

export async function requireGrowthAgentOwnerContext() {
  return assertInternalGrowthAccess();
}

export function resolveGrowthScope(input: { userId: string; scopeType?: GrowthEngineScopeType; scopeId?: string }) {
  const scopeType = input.scopeType ?? "internal_owner";
  const scopeId = input.scopeId ?? input.userId;
  return { scopeType, scopeId };
}

export function assertGrowthEngineTenantAccess(_input: { actorUserId: string; tenantId: string }) {
  throw new ShopReelEndpointError("Public Growth Engine tenant access is scaffolded but not exposed yet", 403);
}
