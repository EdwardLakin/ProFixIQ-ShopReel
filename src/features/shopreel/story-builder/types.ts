import type { StorySourceKind } from "../story-sources/types"

export type StoryTone =
  | "professional"
  | "educational"
  | "friendly"
  | "direct"
  | "confident"
  | "high-energy"

export type StoryOutputChannel =
  | "instagram_reel"
  | "facebook_video"
  | "youtube_short"
  | "tiktok_video"
  | "blog_post"
  | "google_business_post"
  | "email"

export type StorySceneRole =
  | "hook"
  | "problem"
  | "finding"
  | "before"
  | "process"
  | "repair"
  | "result"
  | "after"
  | "explanation"
  | "recommendation"
  | "teaching"
  | "example"
  | "takeaway"
  | "current_state"
  | "milestone"
  | "gratitude"
  | "demo"
  | "context"
  | "service"
  | "what_it_is"
  | "what_we_do"
  | "why_it_matters"
  | "start"
  | "start_of_day"
  | "progress"
  | "end_of_day"
  | "cta"

export type StorySceneMedia = {
  contentAssetId?: string | null
  manualAssetId?: string | null
  url?: string | null
  startSeconds?: number | null
  endSeconds?: number | null
  metadata: Record<string, unknown>
}

export type StoryScene = {
  id: string
  role: StorySceneRole
  title: string
  overlayText?: string | null
  voiceoverText?: string | null
  durationSeconds?: number | null
  media: StorySceneMedia[]
  metadata: Record<string, unknown>
}

export type StoryDraft = {
  id: string
  shopId: string | null
  sourceId: string
  sourceKind: StorySourceKind

  title: string
  hook?: string | null
  caption?: string | null
  cta?: string | null
  hashtags: string[]

  tone: StoryTone
  targetChannels: StoryOutputChannel[]
  targetDurationSeconds?: number | null

  summary?: string | null
  voiceoverText?: string | null
  scriptText?: string | null

  scenes: StoryScene[]
  metadata: Record<string, unknown>

  createdAt?: string
  updatedAt?: string
}
