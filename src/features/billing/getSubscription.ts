import { createAdminClient } from "@/lib/supabase/server";
import type { BillingPlan } from "./plans";

export type ShopReelSubscription = {
  id: string;
  shop_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: BillingPlan;
  status:
    | "inactive"
    | "trialing"
    | "active"
    | "past_due"
    | "unpaid"
    | "canceled"
    | "incomplete"
    | "incomplete_expired";
  generation_limit: number | null;
  period_start: string | null;
  period_end: string | null;
  cancel_at_period_end: boolean;
  metadata: Record<string, unknown> | null;
};

export async function getSubscription(shopId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shopreel_subscriptions")
    .select("*")
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as ShopReelSubscription | null;
}
