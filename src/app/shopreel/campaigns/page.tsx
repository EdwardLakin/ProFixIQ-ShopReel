export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import CampaignGenerator from "@/features/shopreel/campaigns/components/CampaignGenerator";
import { listRecentCampaigns } from "@/features/shopreel/campaigns/lib/server";
import { getCampaignSeedDefaults } from "@/features/shopreel/campaigns/lib/promptSeeding";
import { ShopReelActionRail, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";

export default async function ShopReelCampaignsPage() {
  const campaigns = await listRecentCampaigns(24);
  const seedDefaults = await getCampaignSeedDefaults();
  const queued = campaigns.filter((campaign) => campaign.status === "queued").length;
  const active = campaigns.filter((campaign) => ["processing", "running", "generating"].includes(campaign.status)).length;
  const blocked = campaigns.filter((campaign) => ["failed", "blocked", "needs_attention"].includes(campaign.status)).length;
  const ready = campaigns.filter((campaign) => ["ready", "complete", "published"].includes(campaign.status)).length;
  const recent = campaigns.slice(0, 5);

  return (
    <CampaignFlowShell>
      <CampaignPageHeader
        title="Campaigns"
        subtitle="Create, review, and run premium ShopReel campaigns from one cleaner workflow."
        backHref="/shopreel"
        backLabel="Back to ShopReel"
      />

      <EcosystemStateRail surface="campaigns" />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <ShopReelSurface title="Campaign command center" description="Queue health, execution state, and blocked items in one operating layer.">
            <div className="grid gap-2 text-sm md:grid-cols-4">
              <div className="rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-white">Queued <span className="ml-1 text-lg font-semibold">{queued}</span></div>
              <div className="rounded-xl border border-violet-300/35 bg-violet-500/10 px-3 py-2 text-white">Active <span className="ml-1 text-lg font-semibold">{active}</span></div>
              <div className="rounded-xl border border-amber-300/35 bg-amber-500/10 px-3 py-2 text-white">Blocked <span className="ml-1 text-lg font-semibold">{blocked}</span></div>
              <div className="rounded-xl border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-white">Ready <span className="ml-1 text-lg font-semibold">{ready}</span></div>
            </div>
            <div className="mt-2 grid gap-2 text-xs text-white/70 md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">1. Create campaign brief</div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">2. Generate scene jobs</div>
              <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">3. Assemble + export + publish</div>
            </div>
          </ShopReelSurface>
          {recent.length > 0 ? (
            <ShopReelSurface title="Recent campaign activity" description="Latest execution movement from persisted campaign records.">
              <div className="grid gap-2 md:grid-cols-2">
                {recent.map((campaign) => (
                  <a key={campaign.id} href={`/shopreel/campaigns/${campaign.id}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm hover:border-cyan-300/40">
                    <div className="truncate font-medium text-white">{campaign.title ?? "Untitled campaign"}</div>
                    <div className="mt-1 text-xs capitalize text-white/65">Status: {campaign.status.replaceAll("_", " ")}</div>
                  </a>
                ))}
              </div>
            </ShopReelSurface>
          ) : null}
          <CampaignGenerator campaigns={campaigns} seedDefaults={seedDefaults} />
        </div>
        <ShopReelActionRail title="Campaign rail" items={[`Queued campaigns: ${queued}`,`Active executions: ${active}`,`Blocked campaigns: ${blocked}`,`Ready campaigns: ${ready}`,"Use campaign detail pages to unblock scene jobs"]} />
      </div>
    </CampaignFlowShell>
  );
}
