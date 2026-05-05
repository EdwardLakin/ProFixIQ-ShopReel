export type ShopReelPlatformId =
  | "instagram_reels"
  | "facebook_reels"
  | "tiktok"
  | "youtube_shorts";

export type ShopReelPlatformPreset = {
  id: ShopReelPlatformId;
  label: string;
  shortLabel: string;
  aspectRatio: "9:16";
  recommendedDurationSec: {
    min: number;
    max: number;
    target: number;
  };
  safeTextZone: {
    topPct: number;
    bottomPct: number;
    sidePct: number;
  };
  captionStyle: "short_hook" | "educational" | "story";
  hashtagStyle: "broad_plus_niche" | "niche_heavy";
  requiresThumbnail: boolean;
  ctaStyle: "book_now" | "learn_more" | "comment_prompt";
  exportFileNamePattern: string;
  uploadChecklist: string[];
};

export const SHOPREEL_PLATFORM_PRESETS: ShopReelPlatformPreset[] = [
  {
    id: "instagram_reels",
    label: "Instagram Reels",
    shortLabel: "Instagram",
    aspectRatio: "9:16",
    recommendedDurationSec: { min: 10, max: 60, target: 25 },
    safeTextZone: { topPct: 12, bottomPct: 18, sidePct: 8 },
    captionStyle: "short_hook",
    hashtagStyle: "broad_plus_niche",
    requiresThumbnail: false,
    ctaStyle: "comment_prompt",
    exportFileNamePattern: "instagram-reel-{date}-{slug}",
    uploadChecklist: ["Vertical 9:16 framing", "Clear first 2-second hook"],
  },
  {
    id: "facebook_reels",
    label: "Facebook Reels",
    shortLabel: "Facebook",
    aspectRatio: "9:16",
    recommendedDurationSec: { min: 10, max: 90, target: 30 },
    safeTextZone: { topPct: 12, bottomPct: 20, sidePct: 8 },
    captionStyle: "educational",
    hashtagStyle: "broad_plus_niche",
    requiresThumbnail: false,
    ctaStyle: "learn_more",
    exportFileNamePattern: "facebook-reel-{date}-{slug}",
    uploadChecklist: ["Show clear business context", "Keep overlay text concise"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    shortLabel: "TikTok",
    aspectRatio: "9:16",
    recommendedDurationSec: { min: 8, max: 60, target: 22 },
    safeTextZone: { topPct: 10, bottomPct: 22, sidePct: 8 },
    captionStyle: "short_hook",
    hashtagStyle: "niche_heavy",
    requiresThumbnail: false,
    ctaStyle: "comment_prompt",
    exportFileNamePattern: "tiktok-{date}-{slug}",
    uploadChecklist: ["Pattern interrupt in first second", "Natural, direct language"],
  },
  {
    id: "youtube_shorts",
    label: "YouTube Shorts",
    shortLabel: "YouTube",
    aspectRatio: "9:16",
    recommendedDurationSec: { min: 15, max: 60, target: 35 },
    safeTextZone: { topPct: 10, bottomPct: 15, sidePct: 8 },
    captionStyle: "story",
    hashtagStyle: "broad_plus_niche",
    requiresThumbnail: true,
    ctaStyle: "learn_more",
    exportFileNamePattern: "youtube-short-{date}-{slug}",
    uploadChecklist: ["Promise outcome in opening", "Deliver clear step-by-step value"],
  },
];

export const DEFAULT_SHOPREEL_PLATFORM_IDS: ShopReelPlatformId[] = [
  "instagram_reels",
  "facebook_reels",
  "tiktok",
  "youtube_shorts",
];
