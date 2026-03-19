import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { ensureScenesForCampaignItem, createMediaJobsForCampaignItemScenes } from "@/features/shopreel/campaigns/lib/multiscene";

function buildAngles(coreIdea: string, title: string) {
  return [
    {
      angle: "Problem",
      title: `${title} — Problem`,
      prompt: `Create a short cinematic vertical marketing video about ${coreIdea}. Angle: Problem. Make it clear, modern, emotionally engaging, and platform-ready.`,
      sort_order: 1,
    },
    {
      angle: "Old Way",
      title: `${title} — Old Way`,
      prompt: `Create a short cinematic vertical marketing video about ${coreIdea}. Angle: Old Way. Show the outdated, frustrating, inefficient version clearly.`,
      sort_order: 2,
    },
    {
      angle: "New Way",
      title: `${title} — New Way`,
      prompt: `Create a short cinematic vertical marketing video about ${coreIdea}. Angle: New Way. Show the modern, streamlined, better workflow.`,
      sort_order: 3,
    },
    {
      angle: "Outcome",
      title: `${title} — Outcome`,
      prompt: `Create a short cinematic vertical marketing video about ${coreIdea}. Angle: Outcome. Show the result, confidence, growth, and finished success.`,
      sort_order: 4,
    },
  ];
}

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
      const angles = buildAngles(campaign.core_idea, campaign.title);

      const { data: insertedItems, error: insertItemsError } = await supabase
        .from("shopreel_campaign_items")
        .insert(
          angles.map((angle) => ({
            campaign_id: campaign.id,
            shop_id: shopId,
            angle: angle.angle,
            title: angle.title,
            prompt: angle.prompt,
            sort_order: angle.sort_order,
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
