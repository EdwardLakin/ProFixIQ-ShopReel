export const dynamic = "force-dynamic";
export const revalidate = 0;

import CampaignFlowShell from "@/features/shopreel/campaigns/components/CampaignFlowShell";
import CampaignPageHeader from "@/features/shopreel/campaigns/components/CampaignPageHeader";
import CampaignItemCommandCenter from "@/features/shopreel/campaigns/components/CampaignItemCommandCenter";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export default async function ShopReelCampaignItemPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*, final_output_asset_id")
    .eq("id", id)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs (
        id,
        status,
        output_asset_id,
        preview_url,
        provider,
        provider_job_id,
        error_text
      )
    `)
    .eq("campaign_item_id", item.id)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }


  const sceneIds = (scenes ?? []).map((scene) => scene.id);
  type FrameJob = {
    id: string;
    status: string;
    preview_url: string | null;
    provider: string;
    provider_job_id: string | null;
    error_text: string | null;
    settings: unknown;
    result_payload: unknown;
  };

  let frameJobs: FrameJob[] = [];
  if (sceneIds.length) {
    const { data } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("id, status, preview_url, provider, provider_job_id, error_text, settings, result_payload")
      .eq("shop_id", shopId)
      .eq("job_type", "image")
      .order("created_at", { ascending: false });

    frameJobs = (data ?? []) as FrameJob[];
  }

  const frameByScene = new Map<string, { id: string; status: string; preview_url: string | null; provider: string; provider_job_id: string | null; error_text: string | null; settings: unknown; result_payload: unknown }>();

  function frameRank(job: FrameJob) {
    if (job.preview_url) return 0;
    if (job.status === "completed") return 1;
    if (/queued|processing|running|pending/i.test(job.status ?? "")) return 2;
    if (/failed|error/i.test(job.status ?? "")) return 3;
    return 4;
  }

  for (const job of frameJobs) {
    const settings =
      job.settings && typeof job.settings === "object" && !Array.isArray(job.settings)
        ? (job.settings as Record<string, unknown>)
        : null;
    const sceneId = typeof settings?.scene_id === "string" ? settings.scene_id : null;
    if (!sceneId) continue;

    const existing = frameByScene.get(sceneId);
    if (!existing || frameRank(job) < frameRank(existing as FrameJob)) {
      frameByScene.set(sceneId, job);
    }
  }

  const normalizedScenes = (scenes ?? []).map((scene) => ({
    ...scene,
    media_job: Array.isArray(scene.media_job)
      ? scene.media_job[0] ?? null
      : scene.media_job,
    frame_job: frameByScene.get(scene.id) ?? null,
  }));

  return (
    <CampaignFlowShell>
      <CampaignPageHeader
        title={item.title}
        subtitle="Shape the storyboard, generate scene frames, and move this campaign into production."
        backHref={`/shopreel/campaigns/${item.campaign_id}?panel=production&item=${item.id}`}
        backLabel="Back to campaign workspace"
      />

      <CampaignItemCommandCenter item={item} scenes={normalizedScenes} />
    </CampaignFlowShell>
  );
}
