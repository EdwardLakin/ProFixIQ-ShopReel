import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { buildProductionPackage } from "@/features/shopreel/campaigns/lib/campaignIntelligence";
import type { CampaignMode } from "@/features/shopreel/campaigns/lib/campaignIntakeTypes";
import type { Json } from "@/types/supabase";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const body = await req.json().catch(() => ({})) as { action?: "build" | "approve" };
  const action = body.action ?? "build";
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item } = await supabase.from("shopreel_campaign_items").select("*").eq("id", id).eq("shop_id", shopId).maybeSingle();
  if (!item) return NextResponse.json({ ok: false, error: "Campaign item not found" }, { status: 404 });

  const { data: campaign } = await supabase.from("shopreel_campaigns").select("metadata").eq("id", item.campaign_id).eq("shop_id", shopId).maybeSingle();
  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  const campaignMetadata = (campaign?.metadata ?? {}) as Record<string, unknown>;
  const mode = (campaignMetadata.campaign_mode as CampaignMode | undefined) ?? "general_campaign";

  const pkg = buildProductionPackage(mode, item.title, (metadata.campaign_intelligence as any)?.hook ?? item.title, (metadata.campaign_intelligence as any)?.primary_cta ?? "Get started today");

  const nextMetadata = {
    ...metadata,
    production_package: pkg,
    production_package_status: action === "approve" ? "approved" : "draft",
    approved_at: action === "approve" ? new Date().toISOString() : (typeof metadata.approved_at === "string" ? metadata.approved_at : null),
    approved_from_brief_mode: mode,
  };

  const { error } = await supabase.from("shopreel_campaign_items").update({ metadata: nextMetadata as Json, status: action === "approve" ? "approved" : item.status }).eq("id", id).eq("shop_id", shopId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, productionPackage: pkg, status: action === "approve" ? "approved" : "draft" });
}
