import {
  syncProcessingMediaJobsForCampaign,
  rollupCampaignAnalytics,
  extractCampaignLearnings,
} from "@/features/shopreel/campaigns/lib/server";

export async function runCampaignAutomationCycle(campaignId: string) {
  const syncedJobIds = await syncProcessingMediaJobsForCampaign(campaignId);
  const analytics = await rollupCampaignAnalytics(campaignId);
  const learnings = await extractCampaignLearnings(campaignId);

  return {
    campaignId,
    syncedJobIds,
    analytics,
    learnings,
  };
}
