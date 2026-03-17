import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getStripeServerClient } from "@/features/billing/stripe";
import { upsertSubscriptionFromStripe } from "@/features/billing/upsertSubscriptionFromStripe";

function readSubscriptionPeriod(
  subscription: Stripe.Subscription,
): { periodStart: number | null; periodEnd: number | null } {
  const item = subscription.items.data[0];

  const start =
    typeof item?.current_period_start === "number"
      ? item.current_period_start
      : null;

  const end =
    typeof item?.current_period_end === "number"
      ? item.current_period_end
      : null;

  return {
    periodStart: start,
    periodEnd: end,
  };
}

export async function POST(req: Request) {
  try {
    const stripe = getStripeServerClient();
    const signature = (await headers()).get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { ok: false, error: "Missing Stripe webhook configuration" },
        { status: 400 },
      );
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items.data[0];
        const priceId =
          typeof item?.price?.id === "string" ? item.price.id : null;
        const { periodStart, periodEnd } =
          readSubscriptionPeriod(subscription);

        await upsertSubscriptionFromStripe({
          stripeCustomerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          status: subscription.status,
          periodStart,
          periodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          metadata: subscription.metadata ?? {},
        });

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook failed",
      },
      { status: 400 },
    );
  }
}