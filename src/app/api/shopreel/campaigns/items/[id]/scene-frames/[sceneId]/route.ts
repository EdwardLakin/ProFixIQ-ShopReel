import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getMediaProviderMode } from "@/features/shopreel/video-creation/lib/env";
import { processMediaGenerationJob } from "@/features/shopreel/video-creation/lib/server";
import { buildSceneFramePrompt } from "@/features/shopreel/campaigns/lib/sceneFramePrompt";

export async function POST(req: Request, ctx: { params: Promise<{ id: string; sceneId: string }> }) {
  try {
    const { id, sceneId } = await ctx.params;
    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();
    const body = (await req.json().catch(() => ({}))) as { run?: boolean };

    const { data: scene, error: sceneError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select("id, title, prompt, scene_order, campaign_id, campaign_item_id, shop_id")
      .eq("id", sceneId).eq("campaign_item_id", id).eq("shop_id", shopId).single();
    if (sceneError || !scene) throw new Error(sceneError?.message ?? "Scene not found");

    const { data: item, error: itemError } = await supabase
      .from("shopreel_campaign_items")
      .select("id, title, aspect_ratio, style, visual_mode, metadata")
      .eq("id", id).eq("shop_id", shopId).single();
    if (itemError || !item) throw new Error(itemError?.message ?? "Campaign item not found");

    const provider = getMediaProviderMode() === "fal" ? "fal" : "openai";
    const built = buildSceneFramePrompt({ itemTitle: item.title, sceneTitle: scene.title, basePrompt: scene.prompt });

    const { data: job, error: jobError } = await supabase.from("shopreel_media_generation_jobs").insert({
      shop_id: shopId,
      provider,
      job_type: "image",
      status: "queued",
      title: `${scene.title} keyframe`,
      prompt: built.prompt,
      prompt_enhanced: built.prompt,
      negative_prompt: built.negativePrompt,
      style: item.style,
      visual_mode: item.visual_mode,
      aspect_ratio: item.aspect_ratio,
      input_asset_ids: [],
      settings: { campaign_id: scene.campaign_id, campaign_item_id: scene.campaign_item_id, scene_id: scene.id, scene_order: scene.scene_order, source_metadata: { scene_title: scene.title } },
    }).select("*").single();
    if (jobError || !job) throw new Error(jobError?.message ?? "Failed to create frame job");

    const ran = body.run ? await processMediaGenerationJob(job.id) : job;
    return NextResponse.json({ ok: true, job: ran });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to generate scene frame" }, { status: 500 });
  }
}
