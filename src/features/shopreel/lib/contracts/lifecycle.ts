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
