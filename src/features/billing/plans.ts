export type BillingPlan = "starter" | "creator" | "pro";

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
    monthlyPrice: 39,
    generationLimit: 30,
    description: "For early creators and small businesses validating consistent content.",
    stripeEnvKey: "STRIPE_PRICE_STARTER",
  },
  creator: {
    key: "creator",
    name: "Creator",
    monthlyPrice: 99,
    generationLimit: 150,
    description: "For active creators and businesses publishing every week.",
    badge: "Most popular",
    stripeEnvKey: "STRIPE_PRICE_CREATOR",
  },
  pro: {
    key: "pro",
    name: "Pro",
    monthlyPrice: 249,
    generationLimit: null,
    description: "For serious teams that want always-on content generation.",
    stripeEnvKey: "STRIPE_PRICE_PRO",
  },
};

export function getPlanConfig(plan: BillingPlan): PlanConfig {
  return BILLING_PLANS[plan];
}

export function getPlanByPriceId(priceId: string | null | undefined): PlanConfig | null {
  if (!priceId) return null;

  for (const plan of Object.values(BILLING_PLANS)) {
    if (process.env[plan.stripeEnvKey] === priceId) {
      return plan;
    }
  }

  return null;
}
