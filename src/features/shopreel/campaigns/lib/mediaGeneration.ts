import type { Json } from "@/types/supabase";

type BasicCampaign = { title: string; core_idea: string; metadata?: unknown };
type BasicItem = { title: string; angle: string; metadata?: unknown };
type CampaignPackage = { sections?: Record<string, string | string[]> };
type ParsedBrief = Record<string, unknown>;

type MediaStatus = "not_started" | "queued" | "submitted" | "processing" | "rendering" | "running" | "completed" | "failed" | "canceled";

export type MediaJobView = {
  jobId: string | null;
  status: MediaStatus;
  provider: string | null;
  previewUrl: string | null;
  outputAssetId: string | null;
  errorText: string | null;
  jobHref: string | null;
  requestedAt: string | null;
  updatedAt: string | null;
  purpose?: CampaignImagePurpose | null;
};

export type NormalizedCampaignMediaState = {
  image: MediaJobView;
  video: MediaJobView;
  stage: "blocked" | "ready_for_image" | "image_in_progress" | "ready_for_video" | "video_in_progress" | "done" | "failed";
  nextActionLabel: string;
  helperText: string;
};

export type CampaignImagePurpose = "static_ad" | "video_reference" | "uploaded_reference";
export function isCampaignImagePurpose(value: unknown): value is CampaignImagePurpose { return value === "static_ad" || value === "video_reference" || value === "uploaded_reference"; }

export function normalizeMediaStatus(status: unknown): MediaStatus {
  if (typeof status !== "string" || !status.trim()) return "not_started";
  const v = status.toLowerCase();
  if (["queued", "pending"].includes(v)) return "queued";
  if (v === "submitted") return "submitted";
  if (["processing", "in_progress"].includes(v)) return "processing";
  if (v === "rendering") return "rendering";
  if (v === "running") return "running";
  if (["completed", "ready", "succeeded", "success"].includes(v)) return "completed";
  if (["failed", "error"].includes(v)) return "failed";
  if (["canceled", "cancelled"].includes(v)) return "canceled";
  return "processing";
}
export const ACTIVE_MEDIA_STATUSES: MediaStatus[] = ["queued", "submitted", "processing", "rendering", "running"];
export function isActiveMediaStatus(status: MediaStatus | null | undefined) { return !!status && ACTIVE_MEDIA_STATUSES.includes(status); }

export function deriveCampaignMediaState(input: { packageApproved: boolean; image: MediaJobView; video: MediaJobView; }) : NormalizedCampaignMediaState {
  if (!input.packageApproved) return { image: input.image, video: input.video, stage: "blocked", nextActionLabel: "Approve package", helperText: "Approve the package before generating media." };
  const imageUsable = input.image.status === "completed" && Boolean(input.image.previewUrl || input.image.outputAssetId);
  if (isActiveMediaStatus(input.image.status)) return { image: input.image, video: input.video, stage: "image_in_progress", nextActionLabel: "Open image job", helperText: input.image.status === "queued" ? "Image generation is queued. This can take a little while." : "Image generation is running." };
  if (input.image.status === "failed") return { image: input.image, video: input.video, stage: "failed", nextActionLabel: "Retry image", helperText: "Retry image generation before creating video." };
  if (!input.image.jobId && !imageUsable) return { image: input.image, video: input.video, stage: "ready_for_image", nextActionLabel: "Generate image", helperText: "Generate an image first. Video unlocks after image generation finishes." };
  if (isActiveMediaStatus(input.video.status)) return { image: input.image, video: input.video, stage: "video_in_progress", nextActionLabel: "Open video job", helperText: "Video generation is running." };
  if (imageUsable) return { image: input.image, video: input.video, stage: input.video.status === "completed" ? "done" : "ready_for_video", nextActionLabel: input.video.status === "completed" ? "Open video job" : "Generate video", helperText: "Video will use this image as the starting frame." };
  return { image: input.image, video: input.video, stage: "ready_for_image", nextActionLabel: "Generate image", helperText: "Generate an image first. Video unlocks after image generation finishes." };
}

// existing prompt functions unchanged
export function buildCampaignImagePrompt(input: { campaign: BasicCampaign; item: BasicItem; productionPackage: CampaignPackage; parsedBrief?: ParsedBrief | null; purpose?: CampaignImagePurpose; }) { const sections = input.productionPackage.sections ?? {}; const cta = String(input.parsedBrief?.bookingAction ?? "Message now to book"); const hook = Array.isArray(sections.short_reel_script) ? sections.short_reel_script[0] : sections.short_reel_script; const purpose = input.purpose ?? "static_ad"; const purposeLead = purpose === "video_reference" ? "Create a cinematic vertical 9:16 first/reference frame for short-form video generation." : "Create a clean vertical 9:16 static social ad image usable as a standalone post or boosted ad."; const purposeGuidance = purpose === "video_reference" ? "Focus on a clear primary subject, strong depth, motion potential, and composition that can evolve in image-to-video." : "Design for Facebook/Instagram ad use with realistic local-business context and clear negative space for captions/CTA overlay."; return [purposeLead,purposeGuidance,"Realistic photo style, trustworthy local-business tone.",`Campaign angle: ${input.item.angle}.`,`Core idea: ${input.campaign.core_idea}.`,hook ? `Visual direction from approved package: ${hook}.` : null,`Leave clean negative space for caption overlay and CTA: ${cta}.`,"Avoid tiny unreadable text/logos, fake logos, cluttered layouts, and unrealistic anatomy."].filter(Boolean).join(" "); }
export function buildCampaignVideoPrompt(input: { campaign: BasicCampaign; item: BasicItem; productionPackage: CampaignPackage; imageAsset: { public_url?: string | null; id?: string | null }; }) { if (!input.imageAsset?.public_url) throw new Error("Generate an image before creating video."); const reelScript = input.productionPackage.sections?.short_reel_script; const script = Array.isArray(reelScript) ? reelScript.join(" ") : (reelScript ?? ""); return ["Create a 9:16 short reel in 5 concise scenes using the provided start/reference frame.",`Campaign: ${input.campaign.title}. Angle: ${input.item.angle}.`,script ? `Use this approved script direction: ${script}.` : "Use the approved package tone and messaging.","Include natural camera movement, clear scene transitions, and local service-business realism.","End scene must include a clear CTA overlay moment for booking/contact."].join(" "); }

export function readMediaMetadata(metadata: unknown) { const meta = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {}; const media = meta.media && typeof meta.media === "object" ? (meta.media as Record<string, unknown>) : {}; return { media, imageJobId: typeof media.image_job_id === "string" ? media.image_job_id : null, imageAssetId: typeof media.image_asset_id === "string" ? media.image_asset_id : null, imagePreviewUrl: typeof media.image_preview_url === "string" ? media.image_preview_url : null, imageStatus: typeof media.image_status === "string" ? media.image_status : null, imagePurpose: isCampaignImagePurpose(media.image_purpose) ? media.image_purpose : null, uploadedReferenceUrl: typeof media.uploaded_reference_url === "string" ? media.uploaded_reference_url : null, videoJobId: typeof media.video_job_id === "string" ? media.video_job_id : null, videoAssetId: typeof media.video_asset_id === "string" ? media.video_asset_id : null, videoPreviewUrl: typeof media.video_preview_url === "string" ? media.video_preview_url : null, videoStatus: typeof media.video_status === "string" ? media.video_status : null, imageRequestedAt: typeof media.image_requested_at === "string" ? media.image_requested_at : null, videoRequestedAt: typeof media.video_requested_at === "string" ? media.video_requested_at : null }; }
export function withMediaMetadata(metadata: unknown, patch: Record<string, unknown>): Json { const meta = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {}; const media = meta.media && typeof meta.media === "object" ? (meta.media as Record<string, unknown>) : {}; return { ...meta, media: { ...media, ...patch } } as Json; }
