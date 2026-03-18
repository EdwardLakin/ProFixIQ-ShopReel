import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import CampaignGenerator from "@/features/shopreel/campaigns/components/CampaignGenerator";
import { listRecentCampaigns } from "@/features/shopreel/campaigns/lib/server";
import { getCampaignSeedDefaults } from "@/features/shopreel/campaigns/lib/promptSeeding";

export default async function ShopReelCampaignsPage() {
  const campaigns = await listRecentCampaigns(24);
  const seedDefaults = await getCampaignSeedDefaults();

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Campaign Generator"
      subtitle="Turn one idea into a multi-video campaign with multiple angles and platform-ready content."
    >
      <ShopReelNav />
      <CampaignGenerator campaigns={campaigns} seedDefaults={seedDefaults} />
    </GlassShell>
  );
}
