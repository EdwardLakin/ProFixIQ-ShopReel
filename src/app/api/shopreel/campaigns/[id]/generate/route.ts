import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { ensureScenesForCampaignItem, createMediaJobsForCampaignItemScenes } from "@/features/shopreel/campaigns/lib/multiscene";
import { buildCampaignBrainMetadata, generateDifferentiatedAngles } from "@/features/shopreel/campaigns/lib/campaignIntelligence";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: campaign, error: campaignError } = await supabase
      .from("shopreel_campaigns")
      .select("*")
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(campaignError?.message ?? "Campaign not found");
    }

    const { data: existingItems } = await supabase
      .from("shopreel_campaign_items")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("shop_id", shopId)
      .order("sort_order", { ascending: true });

    let items = existingItems ?? [];

    if (items.length === 0) {
      const angles = generateDifferentiatedAngles({ coreIdea: campaign.core_idea, title: campaign.title });

      const { data: insertedItems, error: insertItemsError } = await supabase
        .from("shopreel_campaign_items")
        .insert(
          angles.map((angle) => ({
            campaign_id: campaign.id,
            shop_id: shopId,
            angle: angle.angle,
            title: angle.title,
            prompt: angle.prompt,
            sort_order: angle.sortOrder,
            metadata: {
              generated_from_campaign: true,
              campaign_intelligence: {
                hook: angle.hook,
                objection: angle.objection,
                emotional_outcome: angle.emotionalOutcome,
                platform_adaptation: angle.platformAdaptation,
              },
            },
            status: "draft",
            aspect_ratio: "9:16",
            duration_seconds: 20,
            style: "cinematic",
            visual_mode: "photoreal",
          }))
        )
        .select("*");

      if (insertItemsError) {
        throw new Error(insertItemsError.message);
      }

      items = insertedItems ?? [];
    }

    const sceneResults = [];
    for (const item of items) {
      const scenes = await ensureScenesForCampaignItem(item.id);
      const jobIds = await createMediaJobsForCampaignItemScenes(item.id);
      sceneResults.push({
        campaignItemId: item.id,
        scenesCreated: scenes.length,
        sceneJobIds: jobIds,
      });
    }

    const { error: updateCampaignError } = await supabase
      .from("shopreel_campaigns")
      .update({
        status: "ready",
        metadata: buildCampaignBrainMetadata(campaign.core_idea),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    if (updateCampaignError) {
      throw new Error(updateCampaignError.message);
    }

    return NextResponse.json({
      ok: true,
      campaignId: campaign.id,
      itemCount: items.length,
      sceneResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate campaign",
      },
      { status: 500 }
    );
  }
}