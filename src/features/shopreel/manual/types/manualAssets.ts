export type ShopReelManualAssetType = "image" | "video" | "mixed";

export type ShopReelManualAssetStatus =
  | "draft"
  | "uploaded"
  | "processing"
  | "ready"
  | "archived"
  | "failed";

export type ShopReelManualContentGoal =
  | "educational_tip"
  | "before_after"
  | "repair_story"
  | "promotion"
  | "customer_trust"
  | "team_culture"
  | "seasonal_reminder"
  | "product_spotlight";

export type CreateManualAssetInput = {
  title: string;
  description?: string | null;
  assetType: ShopReelManualAssetType;
  contentGoal?: ShopReelManualContentGoal | null;
  note?: string | null;
  platformTargets?: string[];
  tags?: string[];
};

export type CreateManualAssetResponse = {
  assetId: string;
  shopId: string;
};

export type SignManualAssetFileInput = {
  assetId: string;
  fileName: string;
  mimeType: string;
  sizeBytes?: number | null;
};

export type SignManualAssetFileResponse = {
  path: string;
  token: string;
  bucket: string;
};

export type CompleteManualAssetFileInput = {
  assetId: string;
  files: Array<{
    filePath: string;
    fileName: string;
    fileType: "image" | "video";
    mimeType: string;
    sizeBytes?: number | null;
    width?: number | null;
    height?: number | null;
    durationSeconds?: number | null;
    sortOrder?: number;
  }>;
};

export type CompleteManualAssetResponse = {
  assetId: string;
  fileCount: number;
  status: "uploaded";
};
