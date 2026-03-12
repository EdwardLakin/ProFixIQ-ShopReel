export type ShopReelContentType =
  | "workflow_demo"
  | "repair_story"
  | "inspection_highlight"
  | "before_after"
  | "educational_tip"
  | "how_to"
  | "findings_on_vehicle";

export type ShopReelPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube";

export type ViralHookOption = {
  hook: string;
  scorePredicted: number;
};

export type ContentCalendarItem = {
  publishDate: string;
  contentType: ShopReelContentType;
  sourceWorkOrderId: string | null;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  platformTargets: ShopReelPlatform[];
};

export type ReelShot = {
  order: number;
  type: string;
  direction: string;
  overlayText: string;
  durationSeconds: number;
};

export type ReelPlanResult = {
  reelPlanId: string;
  shots: ReelShot[];
  overlays: {
    order: number;
    text: string;
  }[];
};

export type MarketingMemoryValue = {
  updatedAt: string;
  topContentTypes: unknown[];
};

export * from "../story-sources";
export * from "../story-builder/types";
export * from "../media/types";
