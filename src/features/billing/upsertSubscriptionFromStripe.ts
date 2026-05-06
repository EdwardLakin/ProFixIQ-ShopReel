import { createAdminClient } from "@/lib/supabase/server";
import { getPlanByPriceId } from "./plans";

export async function upsertSubscriptionFromStripe(input: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  status: string;
  periodStart: number | null;
  periodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = createAdminClient();

  const plan = getPlanByPriceId(input.stripePriceId);

  const shopIdFromMetadata =
    input.metadata && typeof input.metadata.shop_id === "string"
      ? input.metadata.shop_id
      : null;

  let existingShopId: string | null = null;

  const { data: existingByCustomer, error: existingByCustomerError } = await supabase
    .from("shopreel_subscriptions")
    .select("shop_id")
    .eq("stripe_customer_id", input.stripeCustomerId)
    .maybeSingle();

  if (existingByCustomerError) {
    throw new Error(existingByCustomerError.message);
  }

  existingShopId =
    (existingByCustomer as { shop_id?: string } | null)?.shop_id ?? null;

  const shopId = shopIdFromMetadata ?? existingShopId;

  if (!shopId) {
    throw new Error("Unable to resolve shop_id for Stripe subscription");
  }

  const { data, error } = await supabase
    .from("shopreel_subscriptions")
    .upsert(
      {
        shop_id: shopId,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        stripe_price_id: input.stripePriceId,
        plan: plan?.key ?? "starter",
        status: input.status,
        generation_limit: plan?.generationLimit ?? 100,
        period_start: input.periodStart ? new Date(input.periodStart * 1000).toISOString() : null,
        period_end: input.periodEnd ? new Date(input.periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: input.cancelAtPeriodEnd,
        metadata: {
          source: "stripe_webhook",
          ...(input.metadata ?? {}),
        },
      } as never,
      { onConflict: "shop_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
