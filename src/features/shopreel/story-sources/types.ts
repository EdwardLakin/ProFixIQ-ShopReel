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

export type StoryAssetType = "photo" | "video" | "note" | "text" | "other"

export type StoryGenerationMode = "manual" | "assisted" | "autopilot"

export type StorySourceOrigin =
  | "manual_upload"
  | "project"
  | "day_timeline"
  | "imported_media"
  | "future_operational_event"

export type StorySourceAsset = {
  id: string
  assetType: StoryAssetType
  contentAssetId?: string | null
  manualAssetId?: string | null
  url?: string | null
  title?: string | null
  caption?: string | null
  note?: string | null
  takenAt?: string | null
  sortOrder: number
  metadata: Record<string, unknown>
}

export type StorySourceRef = {
  type:
    | "content_asset"
    | "manual_asset"
    | "content_event"
    | "content_piece"
    | "project"
    | "day_bucket"
    | "future_work_order"
    | "future_inspection"
  id: string
}

export type StorySource = {
  id: string
  shopId: string
  title: string
  description?: string | null
  kind: StorySourceKind
  origin: StorySourceOrigin
  generationMode: StoryGenerationMode

  startedAt?: string | null
  endedAt?: string | null
  occurredAt?: string | null

  projectId?: string | null
  projectName?: string | null

  vehicleLabel?: string | null
  customerLabel?: string | null
  technicianLabel?: string | null

  tags: string[]
  assets: StorySourceAsset[]
  refs: StorySourceRef[]

  notes: string[]
  facts: Record<string, unknown>
  metadata: Record<string, unknown>

  createdAt?: string
  updatedAt?: string
}

export type StorySourceCandidate = {
  title: string
  kind: StorySourceKind
  confidence: number
  reason: string
  tags: string[]
  metadata: Record<string, unknown>
}
