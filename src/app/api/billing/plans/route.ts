import { NextResponse } from "next/server";
import { BILLING_PLANS, getStripePriceIdForPlan } from "@/features/billing/plans";

export async function GET() {
  return NextResponse.json({
    ok: true,
    plans: Object.values(BILLING_PLANS).map((plan) => {
      const priceId = getStripePriceIdForPlan(plan.key);

      return {
        key: plan.key,
        name: plan.name,
        description: plan.description,
        bestFor: plan.bestFor,
        monthlyPrice: plan.monthlyPrice,
        generationLimit: plan.generationLimit,
        fairUseLabel: plan.fairUseLabel,
        badge: plan.badge ?? null,
        includedFeatures: plan.includedFeatures,
        premiumFeatures: plan.premiumFeatures,
        capabilities: plan.capabilities,
        stripeConfigured: Boolean(priceId),
      };
    }),
  });
}
