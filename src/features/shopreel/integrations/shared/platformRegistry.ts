import type {
  PlatformIntegration,
  ShopReelPlatform,
} from "./types";

import { instagramIntegration } from "../instagram/connect";
import { facebookIntegration } from "../facebook/connect";
import { youtubeIntegration } from "../youtube/connect";
import { tiktokIntegration } from "../tiktok/connect";

export type SupportedPlatformIntegration =
  | "instagram_reels"
  | "facebook"
  | "youtube_shorts"
  | "tiktok";

export function isSupportedPlatformIntegration(
  platform: ShopReelPlatform,
): platform is SupportedPlatformIntegration {
  return (
    platform === "instagram_reels" ||
    platform === "facebook" ||
    platform === "youtube_shorts" ||
    platform === "tiktok"
  );
}

export function getPlatformIntegration(
  platform: ShopReelPlatform,
): PlatformIntegration {
  switch (platform) {
    case "instagram_reels":
      return instagramIntegration;

    case "facebook":
      return facebookIntegration;

    case "youtube_shorts":
      return youtubeIntegration;

    case "tiktok":
      return tiktokIntegration;

    case "blog":
    case "linkedin":
    case "google_business":
    case "email":
      throw new Error(`No platform integration is wired yet for ${platform}`);
  }
}