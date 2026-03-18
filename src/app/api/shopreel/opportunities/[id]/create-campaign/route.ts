import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Json } from "@/types/supabase";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: opportunity, error: opportunityError } = await supabase
      .from("shopreel_content_opportunities")
      .select(`
        *,
        story_source:shopreel_story_sources (*)
      `)
      .eq("id", id)
      .eq("shop_id", shopId)
      .single();

    if (opportunityError || !opportunity) {
      throw new Error(opportunityError?.message ?? "Opportunity not found");
    }

    const storySource = Array.isArray(opportunity.story_source)
      ? opportunity.story_source[0] ?? null
      : opportunity.story_source;

    if (!storySource?.id) {
      throw new Error("Opportunity is missing story source");
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("shopreel_campaigns")
      .insert({
        shop_id: shopId,
        title: storySource.title,
        core_idea: storySource.description ?? storySource.title,
        audience: null,
        offer: null,
        campaign_goal: "Turn detected opportunity into campaign",
        platform_focus: ["instagram", "facebook", "tiktok", "youtube"],
        status: "draft",
        metadata: {
          source_opportunity_id: opportunity.id,
          source_story_source_id: storySource.id,
        },
      })
      .select("*")
      .single();

    if (campaignError || !campaign) {
      throw new Error(campaignError?.message ?? "Failed to create campaign");
    }

    const nextMetadata =
      opportunity.metadata && typeof opportunity.metadata === "object" && !Array.isArray(opportunity.metadata)
        ? { ...(opportunity.metadata as Record<string, Json | undefined>) }
        : ({} as Record<string, Json | undefined>);

    nextMetadata.linked_campaign_id = campaign.id;

    const { error: updateError } = await supabase
      .from("shopreel_content_opportunities")
      .update({
        status: "generated",
        metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunity.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      ok: true,
      campaign,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create campaign from opportunity",
      },
      { status: 500 }
    );
  }
}
