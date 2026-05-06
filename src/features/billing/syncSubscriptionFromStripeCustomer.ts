import type Stripe from "stripe";
import { getStripeServerClient } from "@/features/billing/stripe";
import { upsertSubscriptionFromStripe } from "@/features/billing/upsertSubscriptionFromStripe";

function readSubscriptionPeriod(
  subscription: Stripe.Subscription,
): { periodStart: number | null; periodEnd: number | null } {
  const item = subscription.items.data[0];

  return {
    periodStart:
      typeof item?.current_period_start === "number"
        ? item.current_period_start
        : null,
    periodEnd:
      typeof item?.current_period_end === "number"
        ? item.current_period_end
        : null,
  };
}

export async function syncSubscriptionFromStripeCustomer(input: {
  stripeCustomerId: string;
  shopId?: string | null;
}) {
  const stripe = getStripeServerClient();

  const subscriptions = await stripe.subscriptions.list({
    customer: input.stripeCustomerId,
    status: "all",
    limit: 10,
    expand: ["data.items.data.price"],
  });

  const sorted = subscriptions.data.sort((a, b) => {
    const activeWeight = (sub: Stripe.Subscription) =>
      sub.status === "active" || sub.status === "trialing"
        ? 2
        : sub.status === "past_due" || sub.status === "incomplete"
          ? 1
          : 0;

    const weightDelta = activeWeight(b) - activeWeight(a);
    if (weightDelta !== 0) return weightDelta;

    return (b.created ?? 0) - (a.created ?? 0);
  });

  const subscription = sorted[0] ?? null;
  if (!subscription) return null;

  const item = subscription.items.data[0];
  const priceId = typeof item?.price?.id === "string" ? item.price.id : null;
  const { periodStart, periodEnd } = readSubscriptionPeriod(subscription);

  return upsertSubscriptionFromStripe({
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    status: subscription.status,
    periodStart,
    periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    metadata: {
      ...(subscription.metadata ?? {}),
      shop_id: subscription.metadata?.shop_id ?? input.shopId ?? undefined,
      source: "stripe_customer_sync",
    },
  });
}
