export const dynamic = "force-dynamic";

import CampaignGenerator from "@/features/shopreel/campaigns/components/CampaignGenerator";
import { listRecentCampaigns } from "@/features/shopreel/campaigns/lib/server";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import SurfaceExecutionHint from "@/features/shopreel/ui/system/SurfaceExecutionHint";
import CampaignWorkflowContinuityRail from "@/features/shopreel/campaigns/components/CampaignWorkflowContinuityRail";

export default async function ShopReelCampaignsNewPage() {
  const campaigns = await listRecentCampaigns(24);

  return (
    <GlassShell title="New campaign" hidePageIntro>
      <div className="space-y-4">
        <EcosystemStateRail surface="campaigns" />
        <SurfaceExecutionHint surface="campaigns" />
        <CampaignWorkflowContinuityRail />
        <CampaignGenerator
          campaigns={campaigns.map((campaign) => ({
            ...campaign,
            production_summary: {
              totalItems: campaign.summary.totalVideos,
              finalReadyItems: campaign.summary.completedVideos,
              totalScenes: campaign.summary.totalScenes,
              queuedScenes: campaign.summary.queuedScenes,
              processingScenes: campaign.summary.processingScenes,
              completedScenes: campaign.summary.completedScenes,
              failedScenes: campaign.summary.failedScenes,
              stageLabel: "Started",
            },
          }))}
          seedDefaults={{ winningAngles: [], suggestedHook: null }}
        />
      </div>
    </GlassShell>
  );
}
