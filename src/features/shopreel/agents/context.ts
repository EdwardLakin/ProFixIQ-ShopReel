import { getBrandBrainProfile, getCampaignBrain } from "@/features/shopreel/brain/repository";

export type AgentPlanningContext = {
  brandBrainSummary: string;
  campaignBrainSummary: string;
  campaignObjective: string | null;
  targetAudience: string | null;
  channelPriorities: string[];
  prohibitedClaimsGuardrail: string[];
  ctaGuardrail: string[];
};

export async function buildAgentPlanningContext(input: { shopId: string; campaignId: string }): Promise<AgentPlanningContext> {
  const [brandBrain, campaignBrain] = await Promise.all([getBrandBrainProfile(input.shopId), getCampaignBrain(input.shopId, input.campaignId)]);
  return {
    brandBrainSummary: `Voice: ${brandBrain?.brand_voice_rules ?? "not set"}. Audience: ${brandBrain?.audience_notes ?? "not set"}`,
    campaignBrainSummary: `Objective: ${campaignBrain?.campaign_objective ?? "not set"}. Audience: ${campaignBrain?.target_audience ?? "not set"}`,
    campaignObjective: campaignBrain?.campaign_objective ?? null,
    targetAudience: campaignBrain?.target_audience ?? null,
    channelPriorities: campaignBrain?.channel_priorities ?? [],
    prohibitedClaimsGuardrail: brandBrain?.prohibited_claims ?? [],
    ctaGuardrail: brandBrain?.preferred_ctas ?? [],
  };
}
