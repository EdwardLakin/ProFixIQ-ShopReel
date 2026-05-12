import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const [{ data: campaign, error: campaignError }, { data: events }, { data: runs }] = await Promise.all([
    supabase.from("shopreel_campaigns").select("id,title,status,platform_focus,updated_at,created_at").eq("shop_id", shopId).eq("id", id).maybeSingle(),
    supabase.from("shopreel_agent_task_approval_events").select("action,reason,created_at").eq("shop_id", shopId).eq("campaign_id", id).order("created_at", { ascending: false }).limit(5),
    supabase.from("shopreel_agent_runs").select("status,updated_at").eq("shop_id", shopId).eq("campaign_id", id).order("updated_at", { ascending: false }).limit(3),
  ]);

  if (campaignError) return NextResponse.json({ ok: false, error: campaignError.message }, { status: 500 });
  if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });

  const reviewStatus = (runs ?? []).some((run) => run.status === "awaiting_approval") ? "awaiting_approval" : "clear";

  return NextResponse.json({
    ok: true,
    campaign: {
      ...campaign,
      channels: campaign.platform_focus ?? [],
      refinementHistory: (events ?? []).map((event) => ({ action: event.action, reason: event.reason, createdAt: event.created_at })),
      reviewStatus,
      continuity: {
        lastDecisionAt: events?.[0]?.created_at ?? campaign.updated_at,
        lastUpdatedAt: campaign.updated_at,
      },
    },
  });
}
