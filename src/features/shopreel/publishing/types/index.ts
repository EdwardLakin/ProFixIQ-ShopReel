import type { Tables } from "@/types/supabase";

export type PublishPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "email"
  | "blog"
  | "linkedin"
  | "google_business";

export type PublishMode =
  | "manual"
  | "assisted"
  | "autopilot"
  | "scheduled";

export type CreatePublicationInput = {
  shopId: string;
  contentPieceId: string | null;
  platform: PublishPlatform;
  platformAccountId?: string | null;
  scheduledFor?: string | null;
  publishMode?: PublishMode | null;
  contentEventId?: string | null;
  contentAssetId?: string | null;
  createdBy?: string | null;
  title?: string | null;
  caption?: string | null;
  videoId?: string | null;
  storySourceId?: string | null;
  storySourceKind?: string | null;
};

export type EnqueuePublishJobInput = {
  shopId: string;
  publicationId: string;
  runAfter?: string | null;
};

export type ContentPublicationRow = Tables<"content_publications">;
