import type { BrandBrainProfile, CampaignBrain } from "./types";

export type BrainPlanningContext = {
  brand: {
    voiceRules: string | null;
    prohibitedClaims: string[];
    preferredCtas: string[];
    audienceNotes: string | null;
  } | null;
  campaign: {
    objective: string | null;
    targetAudience: string | null;
    channelPriorities: string[];
    contentPillars: string[];
  } | null;
};

export function summarizeBrainPlanningContext(brandBrain: BrandBrainProfile | null, campaignBrain: CampaignBrain | null): BrainPlanningContext {
  return {
    brand: brandBrain ? { voiceRules: brandBrain.brand_voice_rules, prohibitedClaims: brandBrain.prohibited_claims, preferredCtas: brandBrain.preferred_ctas, audienceNotes: brandBrain.audience_notes } : null,
    campaign: campaignBrain ? { objective: campaignBrain.campaign_objective, targetAudience: campaignBrain.target_audience, channelPriorities: campaignBrain.channel_priorities, contentPillars: campaignBrain.content_pillars } : null,
  };
}
