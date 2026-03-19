export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import CampaignGenerator from "@/features/shopreel/campaigns/components/CampaignGenerator";
import { listRecentCampaigns } from "@/features/shopreel/campaigns/lib/server";
import { getCampaignSeedDefaults } from "@/features/shopreel/campaigns/lib/promptSeeding";

export default async function ShopReelCampaignNewPage() {
  const campaigns = await listRecentCampaigns(24);
  const seedDefaults = await getCampaignSeedDefaults();

  return (
    <CampaignFlowShell>
      <CampaignPageHeader
        title="New Campaign"
        subtitle="Describe what you want to create, then review and approve the campaign before generation starts."
        backHref="/shopreel/campaigns"
        backLabel="Back to Campaigns"
      />

      <CampaignGenerator campaigns={campaigns} seedDefaults={seedDefaults} />
    </CampaignFlowShell>
  );
}
