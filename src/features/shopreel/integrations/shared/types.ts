export type ShopReelPlatform =
  | "instagram_reels"
  | "facebook"
  | "youtube_shorts"
  | "tiktok";

export type OAuthStartResult = {
  ok: true;
  authorizationUrl: string;
};

export type OAuthCallbackResult = {
  ok: true;
  platform: ShopReelPlatform;
  shopId: string;
  accountLabel?: string | null;
};

export type PublishInput = {
  shopId: string;
  platform: ShopReelPlatform;
  title: string;
  caption?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
};

export type PublishResult = {
  ok: true;
  platform: ShopReelPlatform;
  remotePostId: string;
  status: "queued" | "published";
};

export type PlatformIntegration = {
  startOAuth: (shopId: string) => Promise<OAuthStartResult>;
  finishOAuth: (shopId: string, code: string) => Promise<OAuthCallbackResult>;
  publishVideo: (input: PublishInput) => Promise<PublishResult>;
};
