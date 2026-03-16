import { createAdminClient } from "@/lib/supabase/server";
import type { ShopReelSubscription } from "./getSubscription";

export type UsagePeriodRow = {
  id: string;
  shop_id: string;
  subscription_id: string | null;
  period_start: string;
  period_end: string;
  generations_used: number;
};

export async function ensureUsagePeriod(
  shopId: string,
  subscription: ShopReelSubscription | null,
) {
  const supabase = createAdminClient();

  const now = new Date();
  const periodStart = subscription?.period_start ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd =
    subscription?.period_end ??
    new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("shopreel_usage_periods")
    .select("*")
    .eq("shop_id", shopId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return existing as UsagePeriodRow;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("shopreel_usage_periods")
    .insert({
      shop_id: shopId,
      subscription_id: subscription?.id ?? null,
      period_start: periodStart,
      period_end: periodEnd,
      generations_used: 0,
      metadata: {
        source: "ensureUsagePeriod",
      },
    } as never)
    .select("*")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return inserted as UsagePeriodRow;
}
