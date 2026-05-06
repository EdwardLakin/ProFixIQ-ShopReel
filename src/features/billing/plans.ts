export type BillingPlan = "starter" | "growth" | "unlimited";

export type BillingCapability =
  | "ideas_chat"
  | "manual_create"
  | "review_refine"
  | "social_package_download"
  | "asset_library"
  | "asset_ai_analysis"
  | "ai_video_builder"
  | "campaign_planning"
  | "calendar_planning"
  | "publishing"
  | "automation_loop"
  | "performance_learning";

export type PlanConfig = {
  key: BillingPlan;
  name: string;
  monthlyPrice: number;
  generationLimit: number | null;
  softMonthlyLimit: number | null;
  hardMonthlyLimit: number | null;
  fairUseLabel: string;
  description: string;
  bestFor: string;
  badge?: string;
  stripeEnvKey: string;
  defaultStripePriceId: string;
  includedFeatures: string[];
  premiumFeatures: string[];
  capabilities: BillingCapability[];
};

function cleanStripePriceId(value: string | undefined, fallback: string): string {
  const raw = (value ?? fallback).trim();
  return raw.split(/[=\s]/)[0]?.trim() || fallback;
}

export const BILLING_PLANS: Record<BillingPlan, PlanConfig> = {
  starter: {
    key: "starter",
    name: "Starter",
    monthlyPrice: 49,
    generationLimit: 100,
    softMonthlyLimit: 100,
    hardMonthlyLimit: 100,
    fairUseLabel: "Up to 100 AI generations/month",
    description: "For solo creators and small businesses getting consistent with content.",
    bestFor: "Best for getting started.",
    stripeEnvKey: "STRIPE_PRICE_STARTER",
    defaultStripePriceId: "price_1TBmKlITYwJQigUIwOS6WV1m",
    includedFeatures: [
      "Ideas Chat",
      "Manual Create",
      "Review + Refine",
      "Copy/download packages",
      "Basic Library",
    ],
    premiumFeatures: [
      "100 generations/month",
      "Starter video access",
      "Basic asset analysis",
    ],
    capabilities: [
      "ideas_chat",
      "manual_create",
      "review_refine",
      "social_package_download",
      "asset_library",
    ],
  },
  growth: {
    key: "growth",
    name: "Growth",
    monthlyPrice: 149,
    generationLimit: 500,
    softMonthlyLimit: 500,
    hardMonthlyLimit: 500,
    fairUseLabel: "Up to 500 AI generations/month",
    description: "For businesses creating content every week across multiple channels.",
    bestFor: "Best for consistent content production.",
    badge: "Most popular",
    stripeEnvKey: "STRIPE_PRICE_GROWTH",
    defaultStripePriceId: "price_1TBmLPITYwJQigUIoJ40Bn3L",
    includedFeatures: [
      "Everything in Starter",
      "AI Video Builder",
      "Asset analysis",
      "Campaign planning",
      "Performance learning",
    ],
    premiumFeatures: [
      "500 generations/month",
      "Higher video usage",
      "Advanced library analysis",
    ],
    capabilities: [
      "ideas_chat",
      "manual_create",
      "review_refine",
      "social_package_download",
      "asset_library",
      "asset_ai_analysis",
      "ai_video_builder",
      "campaign_planning",
      "performance_learning",
    ],
  },
  unlimited: {
    key: "unlimited",
    name: "Unlimited",
    monthlyPrice: 399,
    generationLimit: null,
    softMonthlyLimit: null,
    hardMonthlyLimit: null,
    fairUseLabel: "Unlimited standard creation",
    description: "For teams and always-on content operations.",
    bestFor: "Best for teams running content at scale.",
    stripeEnvKey: "STRIPE_PRICE_UNLIMITED",
    defaultStripePriceId: "price_1TBmM6ITYwJQigUILa9mEFQM",
    includedFeatures: [
      "Everything in Growth",
      "Advanced automation workflows",
      "Recurring content loops",
      "Priority creation workflows",
      "Team-scale content engine",
    ],
    premiumFeatures: [
      "Unlimited standard generation",
      "Fair-use safeguards for unusually high-volume automation",
      "Priority workflow access",
    ],
    capabilities: [
      "ideas_chat",
      "manual_create",
      "review_refine",
      "social_package_download",
      "asset_library",
      "asset_ai_analysis",
      "ai_video_builder",
      "campaign_planning",
      "calendar_planning",
      "publishing",
      "automation_loop",
      "performance_learning",
    ],
  },
};

export function getPlanConfig(plan: BillingPlan): PlanConfig {
  return BILLING_PLANS[plan];
}

export function getStripePriceIdForPlan(plan: BillingPlan): string {
  const config = BILLING_PLANS[plan];
  return cleanStripePriceId(process.env[config.stripeEnvKey], config.defaultStripePriceId);
}

export function getPlanByPriceId(
  priceId: string | null | undefined,
): PlanConfig | null {
  if (!priceId) return null;
  const cleaned = cleanStripePriceId(priceId, priceId);

  for (const plan of Object.values(BILLING_PLANS)) {
    if (getStripePriceIdForPlan(plan.key) === cleaned || plan.defaultStripePriceId === cleaned) {
      return plan;
    }
  }

  return null;
}
