import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getSubscription } from "@/features/billing/getSubscription";
import { getStripeServerClient } from "@/features/billing/stripe";
import { getBillingBaseUrl } from "@/features/billing/getBaseUrl";

export async function POST() {
  try {
    const stripe = getStripeServerClient();
    const shopId = await getCurrentShopId();
    const subscription = await getSubscription(shopId);
    const customerId = subscription?.stripe_customer_id ?? null;

    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: "No Stripe customer found for this shop" },
        { status: 400 },
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getBillingBaseUrl()}/shopreel/account`,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create billing portal session",
      },
      { status: 500 },
    );
  }
}
