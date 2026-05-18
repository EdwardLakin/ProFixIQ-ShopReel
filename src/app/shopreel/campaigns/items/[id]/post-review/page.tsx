export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import CampaignPostReviewClient from "@/features/shopreel/campaigns/components/CampaignPostReviewClient";
import { buildPostReviewPayload } from "@/features/shopreel/campaigns/lib/postReview";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { readMediaMetadata } from "@/features/shopreel/campaigns/lib/mediaGeneration";

type ConnectionRow = {
  platform: string;
  connection_active: boolean;
  platform_account_id: string | null;
  platform_username: string | null;
  token_expires_at: string | null;
  metadata?: { meta_page_id?: string | null; meta_page_name?: string | null; meta_instagram_business_id?: string | null } | null;
};

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

  const { data: connections } = await (supabase as any)
    .from("content_platform_accounts")
    .select("platform, connection_active, platform_account_id, platform_username, token_expires_at, metadata")
    .eq("tenant_shop_id", shopId)
    .in("platform", ["facebook", "instagram"]);

  const rows = (connections ?? []) as ConnectionRow[];
  const facebook = rows.find((row) => row.platform === "facebook" && row.connection_active) ?? null;
  const instagram = rows.find((row) => row.platform === "instagram" && row.connection_active) ?? null;

  const publishingConnections = {
    facebook: {
      connected: Boolean(facebook),
      label: facebook?.metadata?.meta_page_name ?? facebook?.platform_username ?? null,
      pageId: facebook?.metadata?.meta_page_id ?? facebook?.platform_account_id ?? null,
      expiresAt: facebook?.token_expires_at ?? null,
    },
    instagram: {
      connected: Boolean(instagram),
      label: instagram?.platform_username ?? instagram?.metadata?.meta_page_name ?? null,
      businessId: instagram?.metadata?.meta_instagram_business_id ?? instagram?.platform_account_id ?? null,
      expiresAt: instagram?.token_expires_at ?? null,
    },
  };

  return <CampaignFlowShell>
    <CampaignPageHeader title={item.title} subtitle={`Campaign mode: ${payload.campaignMode.replaceAll("_", " ")}`} backHref={`/shopreel/campaigns/${campaign.id}`} backLabel="Back to campaign workspace" />
    <CampaignPostReviewClient payload={payload} imageJobId={media.imageJobId} campaignId={campaign.id} publishingConnections={publishingConnections} publishQueueEnabled />
    {intelligence ? <pre className="mt-4 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">Campaign intelligence: {JSON.stringify(intelligence, null, 2)}</pre> : null}
  </CampaignFlowShell>;
}
