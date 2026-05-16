import type { Json } from "@/types/supabase";

type BasicCampaign = { title: string; core_idea: string; metadata?: unknown };
type BasicItem = { title: string; angle: string; metadata?: unknown };
type CampaignPackage = { sections?: Record<string, string | string[]> };
type ParsedBrief = Record<string, unknown>;
type MediaStageInput = {
  packageApproved: boolean;
  imagePurpose: CampaignImagePurpose;
  imageAssetId: string | null;
  imagePreviewUrl: string | null;
  uploadedReferenceUrl: string | null;
  videoJobId: string | null;
};

export type CampaignImagePurpose =
  | "static_ad"
  | "video_reference"
  | "uploaded_reference";

export function isCampaignImagePurpose(value: unknown): value is CampaignImagePurpose {
  return value === "static_ad" || value === "video_reference" || value === "uploaded_reference";
}

export function buildCampaignImagePrompt(input: {
  campaign: BasicCampaign;
  item: BasicItem;
  productionPackage: CampaignPackage;
  parsedBrief?: ParsedBrief | null;
  purpose?: CampaignImagePurpose;
}) {
  const sections = input.productionPackage.sections ?? {};
  const service = String(input.parsedBrief?.serviceCategory ?? input.parsedBrief?.businessType ?? "local service business");
  const location = String(input.parsedBrief?.location ?? "their local market");
  const cta = String(input.parsedBrief?.bookingAction ?? "Message now to book");
  const hook = Array.isArray(sections.short_reel_script) ? sections.short_reel_script[0] : sections.short_reel_script;
  const purpose = input.purpose ?? "static_ad";
  const purposeLead = purpose === "video_reference"
    ? "Create a cinematic vertical 9:16 first/reference frame for short-form video generation."
    : "Create a clean vertical 9:16 static social ad image usable as a standalone post or boosted ad.";
  const purposeGuidance = purpose === "video_reference"
    ? "Focus on a clear primary subject, strong depth, motion potential, and composition that can evolve in image-to-video."
    : "Design for Facebook/Instagram ad use with realistic local-business context and clear negative space for captions/CTA overlay.";

  return [
    purposeLead,
    purposeGuidance,
    "Realistic photo style, trustworthy local-business tone.",
    `Campaign angle: ${input.item.angle}.`,
    `Core idea: ${input.campaign.core_idea}.`,
    hook ? `Visual direction from approved package: ${hook}.` : null,
    `Leave clean negative space for caption overlay and CTA: ${cta}.`,
    "Avoid tiny unreadable text/logos, fake logos, cluttered layouts, and unrealistic anatomy.",
  ].filter(Boolean).join(" ");
}

export function buildCampaignVideoPrompt(input: {
  campaign: BasicCampaign;
  item: BasicItem;
  productionPackage: CampaignPackage;
  imageAsset: { public_url?: string | null; id?: string | null };
}) {
  if (!input.imageAsset?.public_url) {
    throw new Error("Generate an image before creating video.");
  }
  const reelScript = input.productionPackage.sections?.short_reel_script;
  const script = Array.isArray(reelScript) ? reelScript.join(" ") : (reelScript ?? "");
  return [
    "Create a 9:16 short reel in 5 concise scenes using the provided start/reference frame.",
    `Campaign: ${input.campaign.title}. Angle: ${input.item.angle}.`,
    script ? `Use this approved script direction: ${script}.` : "Use the approved package tone and messaging.",
    "Include natural camera movement, clear scene transitions, and local service-business realism.",
    "End scene must include a clear CTA overlay moment for booking/contact.",
  ].join(" ");
}

export function getCampaignMediaStage(input: MediaStageInput) {
  if (!input.packageApproved) return { imageEnabled: false, videoEnabled: false, helper: "Approve the package before generating media." };
  const hasReferenceImage = Boolean(input.imageAssetId || input.imagePreviewUrl || input.uploadedReferenceUrl);
  if (!hasReferenceImage) return { imageEnabled: true, videoEnabled: false, helper: "Generate an image first. Video uses the image as the starting frame." };
  if (input.videoJobId) return { imageEnabled: true, videoEnabled: true, helper: "Video job is in progress or completed. Open the job for details." };
  if (input.imagePurpose === "video_reference") return { imageEnabled: true, videoEnabled: true, helper: "This image was created as a video reference frame." };
  if (input.imagePurpose === "uploaded_reference") return { imageEnabled: true, videoEnabled: true, helper: "Video will use your uploaded image as the reference frame." };
  return { imageEnabled: true, videoEnabled: true, helper: "You can also use this static image as the starting frame for a video." };
}

export function readMediaMetadata(metadata: unknown) {
  const meta = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};
  const media = meta.media && typeof meta.media === "object" ? (meta.media as Record<string, unknown>) : {};
  return {
    media,
    imageJobId: typeof media.image_job_id === "string" ? media.image_job_id : null,
    imageAssetId: typeof media.image_asset_id === "string" ? media.image_asset_id : null,
    imagePreviewUrl: typeof media.image_preview_url === "string" ? media.image_preview_url : null,
    imageStatus: typeof media.image_status === "string" ? media.image_status : null,
    imagePurpose: isCampaignImagePurpose(media.image_purpose) ? media.image_purpose : null,
    uploadedReferenceUrl: typeof media.uploaded_reference_url === "string" ? media.uploaded_reference_url : null,
    videoJobId: typeof media.video_job_id === "string" ? media.video_job_id : null,
    videoAssetId: typeof media.video_asset_id === "string" ? media.video_asset_id : null,
    videoPreviewUrl: typeof media.video_preview_url === "string" ? media.video_preview_url : null,
    videoStatus: typeof media.video_status === "string" ? media.video_status : null,
  };
}

export function withMediaMetadata(metadata: unknown, patch: Record<string, unknown>): Json {
  const meta = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : {};
  const media = meta.media && typeof meta.media === "object" ? (meta.media as Record<string, unknown>) : {};
  return { ...meta, media: { ...media, ...patch } } as Json;
}
