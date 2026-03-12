export type StorySourceKind =
  | "job_completed"
  | "inspection_completed"
  | "repair_completed"
  | "before_after"
  | "project_progress"
  | "project_completed"
  | "educational_insight"
  | "expert_tip"
  | "customer_result"
  | "product_launch"
  | "service_highlight"
  | "milestone"
  | "manual_upload"
  | "daily_timeline"
  | "creator_idea";

export type StorySourceOrigin =
  | "shop_data"
  | "manual_upload"
  | "project"
  | "creator_mode"
  | "future_operational_event"
  | "imported_media"
  | "day_timeline";

export type StoryGenerationMode =
  | "assisted"
  | "manual"
  | "automatic"
  | "autopilot";

export type StorySourceAssetType =
  | "photo"
  | "video"
  | "note"
  | "text"
  | "other";

export type StorySourceAsset = {
  id: string;
  assetType: StorySourceAssetType;
  contentAssetId?: string | null;
  manualAssetId?: string | null;
  url?: string | null;
  title?: string | null;
  caption?: string | null;
  note?: string | null;
  takenAt?: string | null;
  sortOrder: number;
  metadata?: Record<string, unknown>;
};

export type StorySourceRef = {
  type:
    | "content_asset"
    | "manual_asset"
    | "content_event"
    | "content_piece"
    | "project"
    | "day_bucket"
    | "future_work_order"
    | "future_inspection";
  id: string;
};

export type StorySourceFactMap = {
  hook?: string;
  contentType?: string;
  [key: string]: unknown;
};

export type StorySourceCandidate = {
  title: string;
  kind: StorySourceKind;
  confidence: number;
  reason?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type StorySource = {
  id: string;
  shopId: string;

  title: string;
  description?: string | null;

  kind: StorySourceKind;
  origin: StorySourceOrigin;
  generationMode: StoryGenerationMode;

  occurredAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;

  projectId?: string | null;
  projectName?: string | null;

  vehicleLabel?: string | null;
  customerLabel?: string | null;
  technicianLabel?: string | null;

  tags: string[];
  notes: string[];

  facts: StorySourceFactMap;
  metadata: Record<string, unknown>;

  assets: StorySourceAsset[];
  refs: StorySourceRef[];

  createdAt?: string;
  updatedAt?: string;
};
