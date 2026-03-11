export type ShopReelPublishPlatform =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "blog"
  | "linkedin"
  | "google_business"
  | "email";

export type ShopReelPublicationStatus =
  | "draft"
  | "queued"
  | "publishing"
  | "published"
  | "failed"
  | "skipped";

export type CreatePublicationInput = {
  shopId: string;
  contentEventId: string;
  platform: ShopReelPublishPlatform;

  contentPieceId?: string | null;
  contentAssetId?: string | null;
  platformAccountId?: string | null;

  createdBy?: string | null;
  scheduledFor?: string | null;
  publishMode?: "manual" | "scheduled" | "autopilot";

  title?: string | null;
  caption?: string | null;

  // temporary bridge while old video-driven pipeline still exists
  videoId?: string | null;
};

export type EnqueuePublishJobInput = {
  shopId: string;
  publicationId: string;
  runAfter?: string | null;
};