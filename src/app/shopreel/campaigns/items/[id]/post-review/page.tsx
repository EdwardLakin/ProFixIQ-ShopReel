export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import CampaignPostReviewClient from "@/features/shopreel/campaigns/components/CampaignPostReviewClient";
import { buildPostReviewPayload } from "@/features/shopreel/campaigns/lib/postReview";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { readMediaMetadata } from "@/features/shopreel/campaigns/lib/mediaGeneration";

type CampaignPackage = { sections?: Record<string, string | string[]> };

export default async function CampaignItemPostReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase.from("shopreel_campaign_items").select("*").eq("id", id).eq("shop_id", shopId).single();
  if (itemError || !item) throw new Error(itemError?.message ?? "Campaign item not found");

  const { data: campaign, error: campaignError } = await supabase.from("shopreel_campaigns").select("*").eq("id", item.campaign_id).eq("shop_id", shopId).single();
  if (campaignError || !campaign) throw new Error(campaignError?.message ?? "Campaign not found");

  const meta = item.metadata && typeof item.metadata === "object" ? item.metadata as Record<string, unknown> : {};
  const productionPackage = (meta.production_package ?? null) as CampaignPackage | null;
  const intelligence = meta.campaign_intelligence;
  const media = readMediaMetadata(item.metadata);

  const payload = buildPostReviewPayload({ campaign, item, productionPackage, media: { imageUrl: media.imagePreviewUrl, imagePurpose: media.imagePurpose } });

  return <CampaignFlowShell>
    <CampaignPageHeader title={item.title} subtitle={`Campaign mode: ${payload.campaignMode.replaceAll("_", " ")}`} backHref={`/shopreel/campaigns/${campaign.id}`} backLabel="Back to campaign workspace" />
    <CampaignPostReviewClient payload={payload} imageJobId={media.imageJobId} campaignId={campaign.id} />
    {intelligence ? <pre className="mt-4 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">Campaign intelligence: {JSON.stringify(intelligence, null, 2)}</pre> : null}
  </CampaignFlowShell>;
}
