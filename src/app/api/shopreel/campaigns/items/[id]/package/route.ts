import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { buildProductionPackage, mergeMissingAnswersIntoContext } from "@/features/shopreel/campaigns/lib/campaignIntelligence";
import type { CampaignMode } from "@/features/shopreel/campaigns/lib/campaignIntakeTypes";
import type { Json } from "@/types/supabase";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const body = await req.json().catch(() => ({})) as { action?: "build" | "approve"; missingAnswers?: Record<string, string> };
  const action = body.action ?? "build";
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item } = await supabase.from("shopreel_campaign_items").select("*").eq("id", id).eq("shop_id", shopId).maybeSingle();
  if (!item) return NextResponse.json({ ok: false, error: "Campaign item not found" }, { status: 404 });

  const { data: campaign } = await supabase.from("shopreel_campaigns").select("metadata").eq("id", item.campaign_id).eq("shop_id", shopId).maybeSingle();
  const metadata = (item.metadata && typeof item.metadata === "object" ? item.metadata : {}) as Record<string, unknown>;
  const campaignMetadata = (campaign?.metadata && typeof campaign.metadata === "object" ? campaign.metadata : {}) as Record<string, unknown>;
  const mode = (typeof campaignMetadata.campaign_mode === "string" ? campaignMetadata.campaign_mode : "general_campaign") as CampaignMode;
  const campaignIntelligence = (metadata.campaign_intelligence && typeof metadata.campaign_intelligence === "object") ? metadata.campaign_intelligence as Record<string, unknown> : {};

  const mergedContext = mergeMissingAnswersIntoContext(campaignIntelligence, body.missingAnswers ?? {});
  const pkg = buildProductionPackage(mode, item.title, (campaignIntelligence.hook as string | undefined) ?? item.title, (campaignIntelligence.primary_cta as string | undefined) ?? "Get started today");

  const isApprove = action === "approve";
  const nextMetadata = {
    ...metadata,
    campaign_intelligence: mergedContext,
    production_package: pkg,
    production_package_status: isApprove ? "approved" : "draft",
    approved_at: isApprove ? new Date().toISOString() : (typeof metadata.approved_at === "string" ? metadata.approved_at : null),
    angle_approved_at: new Date().toISOString(),
    angle_approval_status: "approved",
    approved_from_brief_mode: mode,
  };

  const { error } = await supabase.from("shopreel_campaign_items").update({ metadata: nextMetadata as Json, status: isApprove ? "approved" : "approved" }).eq("id", id).eq("shop_id", shopId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    productionPackage: pkg,
    status: isApprove ? "approved" : "draft",
    itemId: id,
    message: isApprove ? "Package approved." : "Angle approved and production package built.",
  });
}
