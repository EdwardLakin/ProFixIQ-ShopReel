export const STORY_GENERATION_STATUSES = [
  "draft",
  "queued",
  "processing",
  "ready",
  "published",
  "failed",
] as const;

export type StoryGenerationStatus = (typeof STORY_GENERATION_STATUSES)[number];

export const STORY_GENERATION_QUEUED_STATUS: StoryGenerationStatus = "queued";
export const STORY_GENERATION_READY_STATUS: StoryGenerationStatus = "ready";
export const STORY_GENERATION_FAILED_STATUS: StoryGenerationStatus = "failed";

export const REVIEW_APPROVAL_STATES = [
  "needs_review",
  "approved",
  "needs_changes",
] as const;

export type ReviewApprovalState = (typeof REVIEW_APPROVAL_STATES)[number];

export const REVIEW_APPROVAL_NEEDS_REVIEW_STATE: ReviewApprovalState = "needs_review";
export const REVIEW_APPROVAL_APPROVED_STATE: ReviewApprovalState = "approved";
export const REVIEW_APPROVAL_NEEDS_CHANGES_STATE: ReviewApprovalState = "needs_changes";

export const PUBLISH_JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
] as const;

export type PublishJobStatus = (typeof PUBLISH_JOB_STATUSES)[number];

export const ACTIVE_PUBLISH_JOB_STATUSES: PublishJobStatus[] = ["queued", "processing"];

export const QUEUED_PUBLISH_JOB_STATUS: PublishJobStatus = "queued";
export const PROCESSING_PUBLISH_JOB_STATUS: PublishJobStatus = "processing";
export const COMPLETED_PUBLISH_JOB_STATUS: PublishJobStatus = "completed";
export const FAILED_PUBLISH_JOB_STATUS: PublishJobStatus = "failed";

export const PUBLICATION_STATUSES = [
  "draft",
  "queued",
  "publishing",
  "published",
  "failed",
  "cancelled",
] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const ACTIVE_PUBLICATION_STATUSES: PublicationStatus[] = [
  "queued",
  "publishing",
  "failed",
];

export const QUEUED_PUBLICATION_STATUS: PublicationStatus = "queued";
export const PUBLISHING_PUBLICATION_STATUS: PublicationStatus = "publishing";
export const PUBLISHED_PUBLICATION_STATUS: PublicationStatus = "published";
export const FAILED_PUBLICATION_STATUS: PublicationStatus = "failed";


export const RENDER_JOB_STATUSES = [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type RenderJobStatus = (typeof RENDER_JOB_STATUSES)[number];

export const FAILED_RENDER_JOB_STATUS: RenderJobStatus = "failed";
export const COMPLETED_RENDER_JOB_STATUS: RenderJobStatus = "completed";

