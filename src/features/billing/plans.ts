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

export type BillingPlanConfig = {
  key: BillingPlan;
  name: string;
  monthlyPrice: number;
  description: string;
  fairUseLabel: string;
  softMonthlyLimit: number | null;
  hardMonthlyLimit: number | null;
  generationLimit: number | null;
  includedFeatures: string[];
  gatedFeatures: string[];
  capabilities: BillingCapability[];
  badge?: string;
  stripeEnvKey: string;
};

export const BILLING_PLANS: Record<BillingPlan, BillingPlanConfig> = {
  starter: {
    key: "starter",
    name: "Starter",
    monthlyPrice: 49,
    description:
      "Best for solo creators and small businesses getting consistent with content.",
    fairUseLabel: "Up to 100 AI generations/month",
    softMonthlyLimit: 100,
    hardMonthlyLimit: 100,
    generationLimit: 100,
    includedFeatures: ["Ideas Chat", "Manual Create", "Review + refine", "Copy/download social packages", "Basic Library"],
    gatedFeatures: ["100 generations/month", "limited video creation", "basic asset analysis"],
    capabilities: ["ideas_chat", "manual_create", "review_refine", "social_package_download", "asset_library"],
    stripeEnvKey: "STRIPE_PRICE_STARTER",
  },
  growth: {
    key: "growth",
    name: "Growth",
    monthlyPrice: 149,
    description:
      "Best for businesses creating content weekly across multiple channels.",
    fairUseLabel: "Up to 500 AI generations/month",
    softMonthlyLimit: 500,
    hardMonthlyLimit: 500,
    generationLimit: 500,
    includedFeatures: [
      "Everything in Starter",
      "AI Video Builder",
      "Asset analysis",
      "Campaign planning",
      "More output volume",
      "Performance learning as data grows",
    ],
    gatedFeatures: ["500 generations/month", "higher video usage", "advanced library analysis"],
    capabilities: ["ideas_chat", "manual_create", "review_refine", "social_package_download", "asset_library", "asset_ai_analysis", "ai_video_builder", "campaign_planning", "calendar_planning", "publishing", "performance_learning"],
    badge: "Most popular",
    stripeEnvKey: "STRIPE_PRICE_GROWTH",
  },
  unlimited: {
    key: "unlimited",
    name: "Unlimited",
    monthlyPrice: 399,
    description: "Best for teams and always-on content operations.",
    fairUseLabel:
      "Unlimited standard generations with fair-use safeguards for abnormal automation, spam, or abuse.",
    softMonthlyLimit: null,
    hardMonthlyLimit: null,
    generationLimit: null,
    includedFeatures: [
      "Everything in Growth",
      "highest standard generation volume",
      "advanced automation workflows",
      "recurring content loops",
      "priority creation workflows",
      "team-scale content engine",
    ],
    gatedFeatures: ["Unlimited fair use", "abuse safeguards for abnormal automation/spam", "priority policy controls"],
    capabilities: ["ideas_chat", "manual_create", "review_refine", "social_package_download", "asset_library", "asset_ai_analysis", "ai_video_builder", "campaign_planning", "calendar_planning", "publishing", "automation_loop", "performance_learning"],
    stripeEnvKey: "STRIPE_PRICE_UNLIMITED",
  },
};

export function getPlanConfig(plan: BillingPlan): BillingPlanConfig {
  return BILLING_PLANS[plan];
}

export function getPlanByPriceId(
  priceId: string | null | undefined,
): BillingPlanConfig | null {
  if (!priceId) return null;

  for (const plan of Object.values(BILLING_PLANS)) {
    if (process.env[plan.stripeEnvKey] === priceId) {
      return plan;
    }
  }

  return null;
}
