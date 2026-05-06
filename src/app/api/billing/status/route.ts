import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getSubscription } from "@/features/billing/getSubscription";
import { getUsageSnapshot } from "@/features/billing/getUsageSnapshot";
import { syncSubscriptionFromStripeCustomer } from "@/features/billing/syncSubscriptionFromStripeCustomer";

export async function GET() {
  try {
    let shopId: string | null = null;
    try {
      shopId = await getCurrentShopId();
    } catch {
      shopId = null;
    }

    if (!shopId) {
      return NextResponse.json({
        ok: true,
        shopId: null,
        subscription: null,
        usage: null,
        entitlement: {
          hasBillingScope: false,
          status: "no_shop_scope",
          canPreview: true,
          canExport: false,
          canRender: false,
          canPublish: false,
          needsCheckout: true,
          message: "Start a trial to unlock exports, video generation, and publishing.",
        },
      });
    }

    let subscription = await getSubscription(shopId);

    if (subscription?.stripe_customer_id) {
      const synced = await syncSubscriptionFromStripeCustomer({
        stripeCustomerId: subscription.stripe_customer_id,
        shopId,
      }).catch(() => null);

      if (synced) {
        subscription = await getSubscription(shopId);
      }
    }

    const usage = await getUsageSnapshot(shopId).catch(() => null);

    const status = subscription?.status ?? "none";
    const active = status === "active" || status === "trialing";

    return NextResponse.json({
      ok: true,
      shopId,
      subscription,
      usage,
      entitlement: {
        hasBillingScope: true,
        status,
        canPreview: true,
        canExport: active,
        canRender: active,
        canPublish: active,
        needsCheckout: !active,
        message: active
          ? "Billing is active."
          : "Start a trial or choose a plan to unlock exports, video generation, and publishing.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load billing status",
      },
      { status: 500 },
    );
  }
}
