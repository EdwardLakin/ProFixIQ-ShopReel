import { NextResponse } from "next/server";
import { BILLING_PLANS } from "@/features/billing/plans";

export async function GET() {
  return NextResponse.json({
    ok: true,
    plans: Object.values(BILLING_PLANS).map((plan) => ({
      key: plan.key,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      generationLimit: plan.generationLimit,
      fairUseLabel: plan.fairUseLabel,
      softMonthlyLimit: plan.softMonthlyLimit,
      hardMonthlyLimit: plan.hardMonthlyLimit,
      includedFeatures: plan.includedFeatures,
      gatedFeatures: plan.gatedFeatures,
      capabilities: plan.capabilities,
      badge: plan.badge ?? null,
      stripeConfigured: Boolean(process.env[plan.stripeEnvKey]),
    })),
  });
}
