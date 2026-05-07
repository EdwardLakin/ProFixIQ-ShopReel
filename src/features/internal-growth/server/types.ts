export type GrowthRunStatus = "pending" | "running" | "completed" | "failed";
export type GrowthSourceType = "code_scan" | "manual_seed" | "changelog";
export type GrowthFeatureStatus = "discovered" | "approved" | "ignored";
export type GrowthCampaignType = "feature_launch" | "build_in_public" | "comparison" | "tutorial" | "demo_reel" | "founder_note";
export type GrowthCampaignStatus = "draft" | "approved" | "archived";
export type GrowthPlatform = "instagram" | "tiktok" | "youtube_shorts" | "linkedin" | "x" | "blog";
export type GrowthDraftFormat = "short_video_script" | "caption" | "carousel_outline" | "blog_outline" | "launch_post" | "thumbnail_prompt";
export type GrowthDraftStatus = "draft" | "approved" | "rejected" | "archived";

export type GrowthEngineScopeType = "internal_owner" | "tenant";
export type GrowthEngineSourceType = "internal_shopreel_codebase" | "website" | "manual_feature" | "changelog" | "github_repo_future" | "uploaded_screenshots_future" | "product_feed_future";
export type GrowthEngineSourceStatus = "active" | "paused" | "disconnected";
export type GrowthSignalType = "feature_detected" | "route_changed" | "launch_candidate" | "content_opportunity" | "product_story" | "workflow_improvement";
export type GrowthSignalStatus = "new" | "accepted" | "ignored" | "converted";
export type GrowthAssetType = "short_video" | "carousel" | "thumbnail" | "blog_post" | "launch_image" | "demo_script";
export type GrowthAssetPlanStatus = "planned" | "ready_for_render" | "rendered" | "archived";

export type GrowthEngineSource = {
  id: string;
  scopeType: GrowthEngineScopeType;
  scopeId: string;
  sourceType: GrowthEngineSourceType;
  displayName: string;
  status: GrowthEngineSourceStatus;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type DiscoveredGrowthFeature = {
  featureKey: string;
  title: string;
  description: string;
  routePath: string | null;
  sourceFiles: string[];
  audience: string;
  valueProps: string[];
  launchAngle: string;
  scanMetadata?: { navLabel: string | null; routeGroup: string | null; keywords: string[] };
};

export type GrowthAssetSourceType = "uploaded_image" | "uploaded_video" | "ui_screenshot" | "generated_thumbnail" | "render_output" | "brand_asset" | "placeholder";
export type GrowthAssetSourceStatus = "missing" | "uploaded" | "generated" | "archived";
export type GrowthScreenshotViewport = "desktop" | "tablet" | "mobile";
export type GrowthScreenshotRequestStatus = "requested" | "captured" | "approved" | "archived";
export type GrowthRenderCompositionType = "short_video" | "carousel" | "promo_clip" | "launch_graphic";
export type GrowthRenderStatus = "draft" | "ready" | "rendering" | "completed" | "failed";
export type GrowthRenderJobStatus = "queued" | "preparing" | "rendering" | "completed" | "failed";
