import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { createClient } from "@/lib/supabase/server";
import { getCampaignBrain, upsertCampaignBrain } from "@/features/shopreel/brain/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shopId = await getCurrentShopId();
  const campaignBrain = await getCampaignBrain(shopId, id);
  return NextResponse.json({ ok: true, campaignBrain });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shopId = await getCurrentShopId();
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const body = (await req.json().catch(() => ({}))) as {
    campaignObjective?: string | null;
    targetAudience?: string | null;
    channelPriorities?: string[];
    contentPillars?: string[];
    experimentHypotheses?: string[];
    successSignals?: string[];
  };
  const campaignBrain = await upsertCampaignBrain({
    shopId,
    campaignId: id,
    userId: authData.user?.id ?? null,
    campaignObjective: body.campaignObjective ?? null,
    targetAudience: body.targetAudience ?? null,
    channelPriorities: Array.isArray(body.channelPriorities) ? body.channelPriorities : [],
    contentPillars: Array.isArray(body.contentPillars) ? body.contentPillars : [],
    experimentHypotheses: Array.isArray(body.experimentHypotheses) ? body.experimentHypotheses : [],
    successSignals: Array.isArray(body.successSignals) ? body.successSignals : [],
  });
  return NextResponse.json({ ok: true, campaignBrain });
}
