export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import CampaignDetailClient from "@/features/shopreel/campaigns/components/CampaignDetailClient";
import { listCampaignItemsWithMediaJobs } from "@/features/shopreel/campaigns/lib/server";

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

export default async function ShopReelCampaignDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("shopreel_campaigns")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const items = await listCampaignItemsWithMediaJobs(campaign.id);

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select("id, status, media_job_id, output_asset_id")
    .eq("campaign_id", campaign.id)
    .eq("shop_id", shopId);

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  const totalItems = items.length;
  const completedItems = items.filter((item) => !!item.final_output_asset_id).length;

  const progressPercent =
    totalItems > 0
      ? Math.max(0, Math.min(100, Math.round((completedItems / totalItems) * 100)))
      : 0;

  const totalScenes = (scenes ?? []).length;
  const linkedScenes = (scenes ?? []).filter(
    (scene) => !!scene.media_job_id && scene.status === "draft"
  ).length;
  const queuedScenes = (scenes ?? []).filter((scene) => scene.status === "queued").length;
  const processingScenes = (scenes ?? []).filter(
    (scene) => scene.status === "processing"
  ).length;
  const completedScenes = (scenes ?? []).filter(
    (scene) => scene.status === "completed" || !!scene.output_asset_id
  ).length;
  const failedScenes = (scenes ?? []).filter((scene) => scene.status === "failed").length;

  const { data: analytics } = await supabase
    .from("shopreel_campaign_analytics")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("shop_id", shopId)
    .maybeSingle();

  const { data: learnings } = await supabase
    .from("shopreel_campaign_learnings")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <CampaignFlowShell>
      <CampaignPageHeader
        title={`${campaign.title} — Production`}
        subtitle="Generate scenes, run premium production, sync outputs, and build final campaign ads."
        backHref="/shopreel/campaigns"
        backLabel="Back to Campaigns"
      />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard
          label="Campaign"
          title="Campaign summary"
          description="The core idea driving the whole content batch."
          strong
        >
          <div className="space-y-3">
            <div className={cx("text-sm", glassTheme.text.primary)}>
              {campaign.core_idea}
            </div>

            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">{campaign.status}</GlassBadge>
              {(campaign.platform_focus ?? []).map((platform) => (
                <GlassBadge key={platform} tone="muted">
                  {platform}
                </GlassBadge>
              ))}
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft
              )}
            >
              <div
                className={cx(
                  "text-xs uppercase tracking-[0.18em]",
                  glassTheme.text.muted
                )}
              >
                Audience
              </div>
              <div className={cx("mt-2 text-sm", glassTheme.text.primary)}>
                {campaign.audience ?? "—"}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft
              )}
            >
              <div
                className={cx(
                  "text-xs uppercase tracking-[0.18em]",
                  glassTheme.text.muted
                )}
              >
                Offer
              </div>
              <div className={cx("mt-2 text-sm", glassTheme.text.primary)}>
                {campaign.offer ?? "—"}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft
              )}
            >
              <div
                className={cx(
                  "text-xs uppercase tracking-[0.18em]",
                  glassTheme.text.muted
                )}
              >
                Goal
              </div>
              <div className={cx("mt-2 text-sm", glassTheme.text.primary)}>
                {campaign.campaign_goal ?? "—"}
              </div>
            </div>

            <div className={cx("text-xs", glassTheme.text.secondary)}>
              Created {timeAgoLabel(campaign.created_at)}
            </div>
          </div>
        </GlassCard>

        <CampaignDetailClient
          campaign={campaign}
          items={items}
          analytics={analytics}
          learnings={learnings ?? []}
          progress={{
            totalItems,
            completedItems,
            progressPercent,
            totalScenes,
            linkedScenes,
            queuedScenes,
            processingScenes,
            completedScenes,
            failedScenes,
          }}
        />
      </section>
    </CampaignFlowShell>
  );
}
