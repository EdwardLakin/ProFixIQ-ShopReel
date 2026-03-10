export type ShopReelPublishPlatform =
  | "instagram_reels"
  | "facebook"
  | "youtube_shorts"
  | "tiktok";

export type ShopReelPublicationStatus =
  | "queued"
  | "processing"
  | "published"
  | "failed"
  | "cancelled";

export type CreatePublicationInput = {
  shopId: string;
  videoId: string;
  platform: ShopReelPublishPlatform;
  createdBy?: string | null;
  scheduledFor?: string | null;
  publishMode?: "manual" | "scheduled" | "autopilot";
};

export type EnqueuePublishJobInput = {
  shopId: string;
  publicationId: string;
  runAfter?: string | null;
};
