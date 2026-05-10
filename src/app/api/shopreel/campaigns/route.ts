import { NextResponse } from "next/server";
import { createCampaign } from "@/features/shopreel/campaigns/lib/server";
import { upsertCampaignBrain } from "@/features/shopreel/brain/repository";
import { createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export function validateCreateCampaignPayload(payload: {
  title?: string;
  coreIdea?: string;
}) {
  const title = payload.title?.trim() ?? "";
  const coreIdea = payload.coreIdea?.trim() ?? "";

  if (!title) {
    throw new Error("Campaign title is required");
  }

  if (!coreIdea) {
    throw new Error("Campaign goal/brief is required");
  }

  return { title, coreIdea };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string;
      coreIdea?: string;
      audience?: string | null;
      offer?: string | null;
      campaignGoal?: string | null;
      platformFocus?: string[];
      campaignBrain?: {
        campaignObjective?: string | null;
        targetAudience?: string | null;
        channelPriorities?: string[];
        contentPillars?: string[];
        experimentHypotheses?: string[];
        successSignals?: string[];
      };
    };

    const validated = validateCreateCampaignPayload({
      title: body.title,
      coreIdea: body.coreIdea,
    });

    const campaignId = await createCampaign({
      title: validated.title,
      coreIdea: validated.coreIdea,
      audience: body.audience ?? null,
      offer: body.offer ?? null,
      campaignGoal: body.campaignGoal ?? null,
      platformFocus: Array.isArray(body.platformFocus) ? body.platformFocus : [],
    });

    if (body.campaignBrain) {
      const supabase = await createClient();
      const { data: authData } = await supabase.auth.getUser();
      const shopId = await getCurrentShopId();
      await upsertCampaignBrain({
        shopId,
        campaignId,
        userId: authData.user?.id ?? null,
        campaignObjective: body.campaignBrain.campaignObjective ?? null,
        targetAudience: body.campaignBrain.targetAudience ?? null,
        channelPriorities: Array.isArray(body.campaignBrain.channelPriorities) ? body.campaignBrain.channelPriorities : [],
        contentPillars: Array.isArray(body.campaignBrain.contentPillars) ? body.campaignBrain.contentPillars : [],
        experimentHypotheses: Array.isArray(body.campaignBrain.experimentHypotheses) ? body.campaignBrain.experimentHypotheses : [],
        successSignals: Array.isArray(body.campaignBrain.successSignals) ? body.campaignBrain.successSignals : [],
      });
    }

    return NextResponse.json({
      ok: true,
      id: campaignId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    console.error("[ShopReelCampaignCreateFailure]", {
      route: "/api/shopreel/campaigns",
      stage: "create_campaign_workspace",
      error: message,
      name: error instanceof Error ? error.name : "UnknownError",
    });

    const userFacingError = message.includes("ON CONFLICT specification")
      ? "Campaign workspace setup failed due to a database constraint mismatch. Please retry in a moment."
      : message;

    return NextResponse.json(
      {
        ok: false,
        error: userFacingError,
      },
      { status: 400 }
    );
  }
}
