import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Json } from "@/types/supabase";

type AutoCreateResult = {
  createdCampaignIds: string[];
  skippedOpportunityIds: string[];
};

export async function autoCreateCampaignsFromTopOpportunities(args?: {
  minScore?: number;
  limit?: number;
}) : Promise<AutoCreateResult> {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();
  const minScore = args?.minScore ?? 85;
  const limit = args?.limit ?? 3;

  const { data: opportunities, error } = await supabase
    .from("shopreel_content_opportunities")
    .select(`
      *,
      story_source:shopreel_story_sources (*)
    `)
    .eq("shop_id", shopId)
    .eq("status", "ready")
    .gte("score", minScore)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const createdCampaignIds: string[] = [];
  const skippedOpportunityIds: string[] = [];

  for (const opportunity of opportunities ?? []) {
    const storySource = Array.isArray(opportunity.story_source)
      ? opportunity.story_source[0] ?? null
      : opportunity.story_source;

    if (!storySource?.id) {
      skippedOpportunityIds.push(opportunity.id);
      continue;
    }

    const metadata =
      opportunity.metadata && typeof opportunity.metadata === "object" && !Array.isArray(opportunity.metadata)
        ? { ...(opportunity.metadata as Record<string, Json | undefined>) }
        : {};

    if (typeof metadata.linked_campaign_id === "string" && metadata.linked_campaign_id.length > 0) {
      skippedOpportunityIds.push(opportunity.id);
      continue;
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("shopreel_campaigns")
      .insert({
        shop_id: shopId,
        title: storySource.title,
        core_idea: storySource.description ?? storySource.title,
        audience: null,
        offer: null,
        campaign_goal: "Auto-created from high scoring opportunity",
        platform_focus: ["instagram", "facebook", "tiktok", "youtube"],
        status: "draft",
        metadata: {
          source_opportunity_id: opportunity.id,
          source_story_source_id: storySource.id,
          auto_created: true,
        },
      })
      .select("*")
      .single();

    if (campaignError || !campaign) {
      skippedOpportunityIds.push(opportunity.id);
      continue;
    }

    metadata.linked_campaign_id = campaign.id;
    metadata.auto_created_campaign = true;

    const { error: updateError } = await supabase
      .from("shopreel_content_opportunities")
      .update({
        status: "generated",
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunity.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    createdCampaignIds.push(campaign.id);
  }

  return {
    createdCampaignIds,
    skippedOpportunityIds,
  };
}
