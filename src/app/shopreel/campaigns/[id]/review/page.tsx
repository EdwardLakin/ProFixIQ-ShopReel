export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { listCampaignItemsWithMediaJobs } from "@/features/shopreel/campaigns/lib/server";

export default async function ShopReelCampaignReviewPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

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

  return (
    <CampaignFlowShell>
      <CampaignPageHeader
        title="Quick campaign review"
        subtitle="Inspect the brief, angles, and campaign direction before moving into production."
        backHref="/shopreel/campaigns/new"
        backLabel="Back to Create"
        rightSlot={
          <Link href={`/shopreel/campaigns/${campaign.id}/production`}>
            <GlassButton variant="primary">Continue to workspace</GlassButton>
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard
          label="Campaign"
          title={campaign.title}
          description="This is the campaign brief that will drive generation."
          strong
        >
          <div className="space-y-4">
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
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
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
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
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
              <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Goal
              </div>
              <div className={cx("mt-2 text-sm", glassTheme.text.primary)}>
                {campaign.campaign_goal ?? "—"}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Angles"
          title="Planned campaign outputs"
          description="These are the angle-based items this campaign will produce."
          strong
        >
          <div className="grid gap-3">
            {items.length === 0 ? (
              <div className={cx("text-sm", glassTheme.text.secondary)}>
                No campaign items generated yet. Production will create them.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <GlassBadge tone="muted">{item.angle}</GlassBadge>
                    <GlassBadge tone="default">{item.status}</GlassBadge>
                  </div>

                  <div className={cx("mt-3 text-sm font-medium", glassTheme.text.primary)}>
                    {item.title}
                  </div>

                  <div className={cx("mt-2 text-sm", glassTheme.text.secondary)}>
                    {item.prompt}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/shopreel/campaigns/new">
              <GlassButton variant="ghost">Back to Edit</GlassButton>
            </Link>

            <Link href={`/shopreel/campaigns/${campaign.id}/production`}>
              <GlassButton variant="primary">Continue to workspace, build scenes</GlassButton>
            </Link>
          </div>
        </GlassCard>
      </section>
    </CampaignFlowShell>
  );
}
