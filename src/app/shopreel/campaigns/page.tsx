import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import CampaignGenerator from "@/features/shopreel/campaigns/components/CampaignGenerator";
import { listRecentCampaigns } from "@/features/shopreel/campaigns/lib/server";

export default async function ShopReelCampaignsPage() {
  const campaigns = await listRecentCampaigns(24);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Campaign Generator"
      subtitle="Turn one idea into a multi-video campaign with multiple angles and platform-ready content."
    >
      <ShopReelNav />
      <CampaignGenerator campaigns={campaigns} />
    </GlassShell>
  );
}
