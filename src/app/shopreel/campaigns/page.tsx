export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import CampaignGenerator from "@/features/shopreel/campaigns/components/CampaignGenerator";
import { listRecentCampaigns } from "@/features/shopreel/campaigns/lib/server";
import { getCampaignSeedDefaults } from "@/features/shopreel/campaigns/lib/promptSeeding";
import { ShopReelActionRail, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default async function ShopReelCampaignsPage() {
  const campaigns = await listRecentCampaigns(24);
  const seedDefaults = await getCampaignSeedDefaults();

  return (
    <CampaignFlowShell>
      <CampaignPageHeader
        title="Campaigns"
        subtitle="Create, review, and run premium ShopReel campaigns from one cleaner workflow."
        backHref="/shopreel"
        backLabel="Back to ShopReel"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ShopReelSurface title="Campaign command center" description="Generate, monitor, and advance campaigns without leaving the lifecycle workflow.">
            <div className="grid gap-2 text-sm text-white/80 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Create campaign brief</div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Generate scenes and assets</div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Assemble final campaign output</div>
            </div>
          </ShopReelSurface>
          <CampaignGenerator campaigns={campaigns} seedDefaults={seedDefaults} />
        </div>
        <ShopReelActionRail title="Campaign rail" items={["Use one core idea and one campaign goal","Review scene status before production runs","Use campaign detail page for blocked items","Sync final outputs before export/publish"]} />
      </div>
    </CampaignFlowShell>
  );
}
