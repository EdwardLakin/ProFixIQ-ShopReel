import type {
  PlatformIntegration,
  ShopReelPlatform,
} from "./types";

import { instagramIntegration } from "../instagram/connect";
import { facebookIntegration } from "../facebook/connect";
import { youtubeIntegration } from "../youtube/connect";
import { tiktokIntegration } from "../tiktok/connect";
import { blogIntegration } from "../blog/connect";
import { linkedinIntegration } from "../linkedin/connect";
import { googleBusinessIntegration } from "../google-business/connect";
import { emailIntegration } from "../email/connect";

export type SupportedPlatformIntegration =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok";

export function isSupportedPlatformIntegration(
  platform: ShopReelPlatform,
): platform is SupportedPlatformIntegration {
  return (
    platform === "instagram" ||
    platform === "facebook" ||
    platform === "youtube" ||
    platform === "tiktok"
  );
}

export function getPlatformIntegration(
  platform: ShopReelPlatform,
): PlatformIntegration {
  switch (platform) {
    case "instagram":
      return instagramIntegration;

    case "facebook":
      return facebookIntegration;

    case "youtube":
      return youtubeIntegration;

    case "tiktok":
      return tiktokIntegration;

    case "blog":
      return blogIntegration;

    case "linkedin":
      return linkedinIntegration;

    case "google_business":
      return googleBusinessIntegration;

    case "email":
      return emailIntegration;
  }
}