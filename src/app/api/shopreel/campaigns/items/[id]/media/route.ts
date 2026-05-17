import { NextResponse } from "next/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { createAdminClient } from "@/lib/supabase/server";
import { createMediaGenerationJob } from "@/features/shopreel/video-creation/lib/server";
import { buildCampaignImagePrompt, buildCampaignVideoPrompt, deriveCampaignMediaState, isActiveMediaStatus, isCampaignImagePurpose, normalizeMediaStatus, readMediaMetadata, withMediaMetadata } from "@/features/shopreel/campaigns/lib/mediaGeneration";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();
  const { data: item } = await supabase.from("shopreel_campaign_items").select("*").eq("id", id).eq("shop_id", shopId).maybeSingle();
  if (!item) return NextResponse.json({ ok: false, error: "Campaign item not found" }, { status: 404 });
  const mediaMeta = readMediaMetadata(item.metadata);
  const jobIds = [mediaMeta.imageJobId, mediaMeta.videoJobId].filter(Boolean) as string[];
  const warnings: string[] = [];
  const { data: jobs, error: jobsError } = jobIds.length ? await supabase.from("shopreel_media_generation_jobs").select("id,status,job_type,provider,preview_url,output_asset_id,error_text,updated_at,created_at").in("id", jobIds) : { data: [], error: null as any };
  if (jobsError) warnings.push(`Job lookup warning: ${jobsError.message}`);
  const imageJob = (jobs ?? []).find((j: any) => j.job_type === "image" && j.id === mediaMeta.imageJobId);
  const videoJob = (jobs ?? []).find((j: any) => j.job_type === "video" && j.id === mediaMeta.videoJobId);
  const image = {
    jobId: mediaMeta.imageJobId,
    status: normalizeMediaStatus(imageJob?.status ?? mediaMeta.imageStatus),
    provider: imageJob?.provider ?? "openai",
    previewUrl: imageJob?.preview_url ?? mediaMeta.imagePreviewUrl,
    outputAssetId: imageJob?.output_asset_id ?? mediaMeta.imageAssetId,
    errorText: imageJob?.error_text ?? null,
    jobHref: mediaMeta.imageJobId ? `/shopreel/video-creation/jobs/${mediaMeta.imageJobId}` : null,
    requestedAt: mediaMeta.imageRequestedAt,
    updatedAt: imageJob?.updated_at ?? null,
    purpose: mediaMeta.imagePurpose,
  };
  const video = {
    jobId: mediaMeta.videoJobId,
    status: normalizeMediaStatus(videoJob?.status ?? mediaMeta.videoStatus),
    provider: videoJob?.provider ?? "fal",
    previewUrl: videoJob?.preview_url ?? mediaMeta.videoPreviewUrl,
    outputAssetId: videoJob?.output_asset_id ?? mediaMeta.videoAssetId,
    errorText: videoJob?.error_text ?? null,
    jobHref: mediaMeta.videoJobId ? `/shopreel/video-creation/jobs/${mediaMeta.videoJobId}` : null,
    requestedAt: mediaMeta.videoRequestedAt,
    updatedAt: videoJob?.updated_at ?? null,
  };
  if (image.status === "completed" && !image.previewUrl && !image.outputAssetId) {
    warnings.push("Image job completed but no preview URL is available.");
  }
  const packageApproved = Boolean((item.metadata as any)?.production_package_status === "approved");
  const normalized = deriveCampaignMediaState({ packageApproved, image, video });
  return NextResponse.json({ ok: true, itemId: id, media: normalized, warnings });
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const body = await req.json().catch(() => ({})) as { action?: "generate_image" | "generate_video"; imagePurpose?: unknown };
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();
  const { data: item } = await supabase.from("shopreel_campaign_items").select("*").eq("id", id).eq("shop_id", shopId).maybeSingle();
  if (!item) return NextResponse.json({ ok: false, error: "Campaign item not found" }, { status: 404 });
  const { data: campaign } = await supabase.from("shopreel_campaigns").select("*").eq("id", item.campaign_id).eq("shop_id", shopId).maybeSingle();
  if (!campaign) return NextResponse.json({ ok: false, error: "Campaign not found" }, { status: 404 });
  const meta = item.metadata && typeof item.metadata === "object" ? item.metadata as Record<string, unknown> : {};
  const pkgStatus = typeof meta.production_package_status === "string" ? meta.production_package_status : "draft";
  const productionPackage = meta.production_package && typeof meta.production_package === "object" ? meta.production_package as { sections?: Record<string, string | string[]> } : null;
  if (!productionPackage || pkgStatus !== "approved") return NextResponse.json({ ok: false, error: "Approve the package before generating media." }, { status: 400 });
  const mediaMeta = readMediaMetadata(item.metadata);
  const campaignMeta = campaign.metadata && typeof campaign.metadata === "object" ? campaign.metadata as Record<string, unknown> : {};
  const parsedBrief = campaignMeta.parsed_brief && typeof campaignMeta.parsed_brief === "object" ? campaignMeta.parsed_brief as Record<string, unknown> : {};

  if (body.action === "generate_image") {
    const imagePurpose = isCampaignImagePurpose(body.imagePurpose) ? body.imagePurpose : "static_ad";
    if (mediaMeta.imageJobId) {
      const { data: existingImageJob } = await supabase.from("shopreel_media_generation_jobs").select("id,status").eq("id", mediaMeta.imageJobId).maybeSingle();
      const existingStatus = normalizeMediaStatus(existingImageJob?.status ?? mediaMeta.imageStatus);
      if (isActiveMediaStatus(existingStatus)) {
        return NextResponse.json({ ok: true, message: "Image generation already in progress.", jobId: mediaMeta.imageJobId, status: existingStatus, jobRoute: `/shopreel/video-creation/jobs/${mediaMeta.imageJobId}`, existing: true });
      }
    }
    if (imagePurpose === "uploaded_reference") {
      return NextResponse.json({ ok: false, error: "Uploaded reference image is not connected to this campaign item yet." }, { status: 400 });
    }
    const prompt = buildCampaignImagePrompt({ campaign, item, productionPackage, parsedBrief, purpose: imagePurpose });
    const job = await createMediaGenerationJob({ title: `${item.title} image`, prompt, negativePrompt: "distorted text, fake logos, artifacts, extra limbs", jobType: "image", provider: "openai", style: (item.style as any) ?? "commercial", visualMode: (item.visual_mode as any) ?? "photoreal", aspectRatio: item.aspect_ratio as any, durationSeconds: null, inputAssetIds: [] });
    await supabase.from("shopreel_campaign_items").update({ metadata: withMediaMetadata(item.metadata, { image_purpose: imagePurpose, image_intent_label: imagePurpose, image_job_id: job.id, image_status: "queued", image_requested_at: new Date().toISOString() }) }).eq("id", id).eq("shop_id", shopId);
    return NextResponse.json({ ok: true, message: "Image generation started.", jobId: job.id, status: job.status, jobRoute: `/shopreel/video-creation/jobs/${job.id}` });
  }

  if (body.action === "generate_video") {
    let imageAssetId = mediaMeta.imageAssetId;
    let imagePreviewUrl = mediaMeta.imagePreviewUrl;
    if (mediaMeta.imageJobId) {
      const { data: imageJob } = await supabase.from("shopreel_media_generation_jobs").select("id,status,output_asset_id,preview_url").eq("id", mediaMeta.imageJobId).maybeSingle();
      if (imageJob?.output_asset_id) imageAssetId = imageJob.output_asset_id;
      if (imageJob?.preview_url) imagePreviewUrl = imageJob.preview_url;
    }
    const imagePurpose = mediaMeta.imagePurpose ?? "static_ad";
    const uploadedReferenceUrl = mediaMeta.uploadedReferenceUrl;
    const sourceImageType: "generated" | "uploaded" = imagePreviewUrl ? "generated" : "uploaded";
    if (!imagePreviewUrl && uploadedReferenceUrl) imagePreviewUrl = uploadedReferenceUrl;
    if (!imagePreviewUrl) return NextResponse.json({ ok: false, error: "Generate an image before creating video." }, { status: 400 });
    const imageAsset = imageAssetId ? await supabase.from("content_assets").select("id,public_url").eq("id", imageAssetId).maybeSingle() : { data: { id: null, public_url: imagePreviewUrl } };
    const prompt = buildCampaignVideoPrompt({ campaign, item, productionPackage, imageAsset: imageAsset.data ?? { public_url: imagePreviewUrl } });
    const job = await createMediaGenerationJob({ title: `${item.title} video`, prompt, negativePrompt: "jittery motion, unreadable text, unnatural anatomy", jobType: "video", provider: "fal" as any, style: (item.style as any) ?? "commercial", visualMode: (item.visual_mode as any) ?? "photoreal", aspectRatio: item.aspect_ratio as any, durationSeconds: item.duration_seconds ?? 10, inputAssetIds: imageAssetId ? [imageAssetId] : [], settings: { start_image_url: imagePreviewUrl, campaign_item_id: item.id, image_purpose: imagePurpose, source_image_type: sourceImageType } as any });
    await supabase.from("shopreel_campaign_items").update({ metadata: withMediaMetadata(item.metadata, { image_asset_id: imageAssetId, image_preview_url: imagePreviewUrl, video_job_id: job.id, video_status: "queued", video_requested_at: new Date().toISOString() }) }).eq("id", id).eq("shop_id", shopId);
    return NextResponse.json({ ok: true, message: "Video generation started.", jobId: job.id, status: job.status, jobRoute: `/shopreel/video-creation/jobs/${job.id}` });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action" }, { status: 400 });
}
