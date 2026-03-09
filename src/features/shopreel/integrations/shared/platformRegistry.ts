import type {
  PlatformIntegration,
  ShopReelPlatform,
} from "./types";
import { instagramIntegration } from "../instagram/connect";
import { facebookIntegration } from "../facebook/connect";
import { youtubeIntegration } from "../youtube/connect";
import { tiktokIntegration } from "../tiktok/connect";

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
    default:
      throw new Error(`Unsupported platform: ${platform satisfies never}`);
  }
}
