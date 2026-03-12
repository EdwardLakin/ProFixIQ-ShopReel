export type ContentAssetMetadata = {
  tags?: string[]
  colors?: string[]
  objects?: string[]
  themes?: string[]
  searchableText?: string | null
  technicianLabel?: string | null
  customerLabel?: string | null
  vehicleLabel?: string | null
  projectLabel?: string | null
  capturedAt?: string | null
  [key: string]: unknown
}

export type MediaSearchQuery = {
  text?: string
  tags?: string[]
  colors?: string[]
  objects?: string[]
  themes?: string[]
  fromDate?: string | null
  toDate?: string | null
  limit?: number
}

export type MediaSearchResult = {
  id: string
  title?: string | null
  publicUrl?: string | null
  storagePath?: string | null
  assetType: "photo" | "video" | "thumbnail" | "render_input" | "render_output" | "other"
  score?: number | null
  metadata: ContentAssetMetadata
}
