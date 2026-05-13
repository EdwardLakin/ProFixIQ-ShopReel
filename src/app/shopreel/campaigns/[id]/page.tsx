export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import Link from "next/link";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import CampaignDetailClient from "@/features/shopreel/campaigns/components/CampaignDetailClient";
import { listCampaignItemsWithMediaJobs } from "@/features/shopreel/campaigns/lib/server";
import CampaignWorkflowContinuityRail from "@/features/shopreel/campaigns/components/CampaignWorkflowContinuityRail";
import { buildAdaptiveCreativeMemory } from "@/features/shopreel/learning/adaptiveCreativeMemory";
import { notFound } from "next/navigation";

function timeAgoLabel(value: string) {
  const now = Date.now();
  const then = new Date(value).getTime();
  const diffMs = Math.max(0, now - then);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(value).toLocaleDateString();
}

export default async function ShopReelCampaignDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();

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
    notFound();
  }

  const items = await listCampaignItemsWithMediaJobs(campaign.id);

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select("id, status, media_job_id, output_asset_id")
    .eq("campaign_id", campaign.id)
    .eq("shop_id", shopId);

  if (scenesError) {
    throw new Error(scenesError.message);
  }


  const { data: approvalEvents } = await supabase
    .from("shopreel_agent_task_approval_events")
    .select("action, reason, metadata, created_at, campaign_id")
    .eq("shop_id", shopId)
    .eq("campaign_id", campaign.id)
    .order("created_at", { ascending: false })
    .limit(80);

  const adaptiveMemory = buildAdaptiveCreativeMemory((approvalEvents ?? []).map((event) => ({
    action: event.action as "approved" | "rejected" | "canceled",
    reason: event.reason,
    metadata: event.metadata as { decisionMode?: string; refinementSignal?: string | null } | null,
    createdAt: event.created_at,
    campaignId: event.campaign_id,
  })));

  const totalItems = items.length;
  const completedItems = items.filter((item) => !!item.final_output_asset_id).length;

  const progressPercent =
    totalItems > 0
      ? Math.max(0, Math.min(100, Math.round((completedItems / totalItems) * 100)))
      : 0;

  const totalScenes = (scenes ?? []).length;
  const queuedScenes = (scenes ?? []).filter((scene) => scene.status === "queued").length;
  const processingScenes = (scenes ?? []).filter(
    (scene) => scene.status === "processing"
  ).length;
  const completedScenes = (scenes ?? []).filter(
    (scene) => scene.status === "completed" || !!scene.output_asset_id
  ).length;
  const failedScenes = (scenes ?? []).filter((scene) => scene.status === "failed").length;

  return (
    <CampaignFlowShell>
      <CampaignPageHeader
        title={campaign.title}
        subtitle="Mission → AI planning → approval → execution → review. Supervise key decisions while the operator advances the campaign."
        backHref="/shopreel/campaigns"
        backLabel="Back to Campaigns"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={`/shopreel/campaigns/${campaign.id}`}>
          <GlassButton variant="primary">Workspace</GlassButton>
        </Link>
        <Link href={`/shopreel/campaigns/${campaign.id}/review`}>
          <GlassButton variant="ghost">Review panel</GlassButton>
        </Link>
        <Link href={`/shopreel/campaigns/${campaign.id}/production`}>
          <GlassButton variant="ghost">Production panel</GlassButton>
        </Link>
      </div>

      <CampaignWorkflowContinuityRail campaignId={campaign.id} />

      <section className="relative isolate overflow-hidden rounded-[2.4rem] border border-cyan-200/20 bg-slate-950/40 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(6,182,212,0.2),transparent_40%),radial-gradient(circle_at_84%_78%,rgba(56,189,248,0.12),transparent_44%)]" />
        <div className="relative grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
          <aside className="space-y-4 rounded-3xl border border-white/10 bg-black/25 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/75">Mission shell</p>
            <p className="text-sm text-white/85">{campaign.core_idea}</p>
            <div className="flex flex-wrap gap-2"><GlassBadge tone="default">{campaign.status}</GlassBadge>{(campaign.platform_focus ?? []).map((platform) => <GlassBadge key={platform} tone="muted">{platform}</GlassBadge>)}</div>
            <div className="space-y-3 text-sm text-white/75">
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">Audience</p><p>{campaign.audience ?? "—"}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">Emotional positioning</p><p>{campaign.offer ?? "No emotional positioning captured yet."}</p></div>
              <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">Objective</p><p>{campaign.campaign_goal ?? "—"}</p></div>
              <p className="text-xs text-white/55">Created {timeAgoLabel(campaign.created_at)}</p>
            </div>
          </aside>
          <CampaignDetailClient
            campaign={campaign}
            items={items}
            progress={{
              totalItems,
              completedItems,
              progressPercent,
              totalScenes,
              queuedScenes,
              processingScenes,
              completedScenes,
              failedScenes,
            }}
            adaptiveMemory={adaptiveMemory}
          />
        </div>
      </section>
    </CampaignFlowShell>
  );
}
