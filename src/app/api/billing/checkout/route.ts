import { NextRequest, NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getStripeServerClient } from "@/features/billing/stripe";
import { BILLING_PLANS, type BillingPlan } from "@/features/billing/plans";
import { createAdminClient } from "@/lib/supabase/server";
import { getBillingBaseUrl } from "@/features/billing/getBaseUrl";
import { getSubscription } from "@/features/billing/getSubscription";

type Body = {
  plan: BillingPlan;
};

async function safeReadJson(req: NextRequest): Promise<Body> {
  const text = await req.text();

  if (!text.trim()) {
    throw new Error("Missing request body");
  }

  return JSON.parse(text) as Body;
}

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadJson(req);

    if (!(body.plan in BILLING_PLANS)) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan" },
        { status: 400 },
      );
    }

    const stripe = getStripeServerClient();
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();
    const baseUrl = getBillingBaseUrl();
    const plan = BILLING_PLANS[body.plan];
    const priceId = process.env[plan.stripeEnvKey];

    if (!priceId) {
      throw new Error(`Missing ${plan.stripeEnvKey}`);
    }

    const existingSubscription = await getSubscription(shopId);

    let customerId = existingSubscription?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          shop_id: shopId,
          product: "shopreel",
        },
      });

      customerId = customer.id;

      await supabase.from("shopreel_subscriptions").upsert(
        {
          shop_id: shopId,
          stripe_customer_id: customerId,
          plan: body.plan,
          status: "inactive",
          generation_limit: plan.generationLimit,
          metadata: {
            source: "checkout_init",
          },
        } as never,
        { onConflict: "shop_id" },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/shopreel?billing=success`,
      cancel_url: `${baseUrl}/?billing=cancelled`,
      allow_promotion_codes: true,
      metadata: {
        shop_id: shopId,
        plan: body.plan,
        product: "shopreel",
      },
      subscription_data: {
        metadata: {
          shop_id: shopId,
          plan: body.plan,
          product: "shopreel",
        },
      },
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 },
    );
  }
}