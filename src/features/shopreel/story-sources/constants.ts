import type { StorySourceKind } from "./types"

export const STORY_SOURCE_KINDS: readonly StorySourceKind[] = [
  "job_completed",
  "inspection_completed",
  "repair_completed",
  "before_after",
  "project_progress",
  "project_completed",
  "educational_insight",
  "expert_tip",
  "customer_result",
  "product_launch",
  "service_highlight",
  "milestone",
  "manual_upload",
  "daily_timeline",
  "creator_idea",
] as const

export const DEFAULT_SCENE_SHAPE_BY_SOURCE_KIND: Record<
  StorySourceKind,
  readonly string[]
> = {
  job_completed: ["hook", "problem", "process", "result", "cta"],

  inspection_completed: [
    "hook",
    "finding",
    "explanation",
    "recommendation",
    "cta",
  ],

  repair_completed: [
    "hook",
    "problem",
    "repair",
    "result",
    "cta",
  ],

  before_after: [
    "hook",
    "before",
    "process",
    "after",
    "cta",
  ],

  project_progress: [
    "hook",
    "start",
    "progress",
    "current_state",
    "cta",
  ],

  project_completed: [
    "hook",
    "challenge",
    "process",
    "result",
    "cta",
  ],

  educational_insight: [
    "hook",
    "teaching",
    "example",
    "takeaway",
    "cta",
  ],

  expert_tip: [
    "hook",
    "tip",
    "why_it_matters",
    "example",
    "cta",
  ],

  customer_result: [
    "hook",
    "context",
    "solution",
    "outcome",
    "cta",
  ],

  product_launch: [
    "hook",
    "what_it_is",
    "benefit",
    "demo",
    "cta",
  ],

  service_highlight: [
    "hook",
    "service",
    "what_we_do",
    "result",
    "cta",
  ],

  milestone: [
    "hook",
    "milestone",
    "why_it_matters",
    "gratitude",
    "cta",
  ],

  manual_upload: [
    "hook",
    "context",
    "story",
    "result",
    "cta",
  ],

  daily_timeline: [
    "hook",
    "start_of_day",
    "progress",
    "end_of_day",
    "cta",
  ],

  creator_idea: [
    "hook",
    "context",
    "explanation",
    "takeaway",
    "cta",
  ],
} as const
