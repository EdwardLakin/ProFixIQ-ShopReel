export type GrowthRunStatus = "pending" | "running" | "completed" | "failed";
export type GrowthSourceType = "code_scan" | "manual_seed" | "changelog";
export type GrowthFeatureStatus = "discovered" | "approved" | "ignored";
export type GrowthCampaignType = "feature_launch" | "build_in_public" | "comparison" | "tutorial" | "demo_reel" | "founder_note";
export type GrowthCampaignStatus = "draft" | "approved" | "archived";
export type GrowthPlatform = "instagram" | "tiktok" | "youtube_shorts" | "linkedin" | "x" | "blog";
export type GrowthDraftFormat = "short_video_script" | "caption" | "carousel_outline" | "blog_outline" | "launch_post" | "thumbnail_prompt";
export type GrowthDraftStatus = "draft" | "approved" | "rejected" | "archived";

export type DiscoveredGrowthFeature = {
  featureKey: string;
  title: string;
  description: string;
  routePath: string | null;
  sourceFiles: string[];
  audience: string;
  valueProps: string[];
  launchAngle: string;
};
