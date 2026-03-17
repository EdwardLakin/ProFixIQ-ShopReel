export type BillingPlan = "starter" | "growth" | "unlimited";

export type PlanConfig = {
  key: BillingPlan;
  name: string;
  monthlyPrice: number;
  generationLimit: number | null;
  description: string;
  badge?: string;
  stripeEnvKey: string;
};

export const BILLING_PLANS: Record<BillingPlan, PlanConfig> = {
  starter: {
    key: "starter",
    name: "Starter",
    monthlyPrice: 49,
    generationLimit: 100,
    description:
      "For smaller businesses getting consistent with AI-generated content and publishing.",
    stripeEnvKey: "STRIPE_PRICE_STARTER",
  },
  growth: {
    key: "growth",
    name: "Growth",
    monthlyPrice: 149,
    generationLimit: 500,
    description:
      "For growing businesses running content weekly across multiple channels.",
    badge: "Most popular",
    stripeEnvKey: "STRIPE_PRICE_GROWTH",
  },
  unlimited: {
    key: "unlimited",
    name: "Unlimited",
    monthlyPrice: 399,
    generationLimit: null,
    description:
      "For serious teams that want always-on AI marketing automation without generation caps.",
    stripeEnvKey: "STRIPE_PRICE_UNLIMITED",
  },
};

export function getPlanConfig(plan: BillingPlan): PlanConfig {
  return BILLING_PLANS[plan];
}

export function getPlanByPriceId(
  priceId: string | null | undefined,
): PlanConfig | null {
  if (!priceId) return null;

  for (const plan of Object.values(BILLING_PLANS)) {
    if (process.env[plan.stripeEnvKey] === priceId) {
      return plan;
    }
  }

  return null;
}