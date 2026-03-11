export type ShopReelPlatform =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "blog"
  | "linkedin"
  | "google_business"
  | "email";

export type OAuthStartResult = {
  ok: true;
  authorizationUrl: string;
};

export type OAuthCallbackResult = {
  ok: true;
  platform: ShopReelPlatform;
  shopId: string;
  accountLabel?: string | null;
  platformAccountId?: string | null;
};

export type PublishInput = {
  shopId: string;
  platform: ShopReelPlatform;
  title: string;
  caption?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;

  contentEventId?: string | null;
  contentPieceId?: string | null;
  contentAssetId?: string | null;
  publicationId?: string | null;
  platformAccountId?: string | null;
};

export type PublishResult = {
  ok: true;
  platform: ShopReelPlatform;
  remotePostId: string;
  remotePostUrl?: string | null;
  status: "queued" | "published";
};

export type PlatformIntegration = {
  startOAuth: (shopId: string) => Promise<OAuthStartResult>;
  finishOAuth: (shopId: string, code: string) => Promise<OAuthCallbackResult>;
  publishVideo: (input: PublishInput) => Promise<PublishResult>;
};