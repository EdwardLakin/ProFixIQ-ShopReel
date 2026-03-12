import { createPublication } from "./createPublication";
import { enqueuePublishJob } from "./enqueuePublishJob";

export async function createPublicationBundle(input: {
  shopId: string;
  contentPieceId: string;
  platform: "instagram" | "facebook" | "tiktok" | "youtube";
  platformAccountId?: string | null;
  scheduledFor?: string | null;
  publishMode?: "manual" | "assisted" | "autopilot" | "scheduled" | null;
  contentEventId?: string | null;
  contentAssetId?: string | null;
  createdBy?: string | null;
  title?: string | null;
  caption?: string | null;
  videoId?: string | null;
  storySourceId?: string | null;
  storySourceKind?: string | null;
  enqueueNow?: boolean;
}) {
  const publication = await createPublication({
    shopId: input.shopId,
    contentPieceId: input.contentPieceId,
    platform: input.platform,
    platformAccountId: input.platformAccountId ?? null,
    scheduledFor: input.scheduledFor ?? null,
    publishMode: input.publishMode ?? "manual",
    contentEventId: input.contentEventId ?? null,
    contentAssetId: input.contentAssetId ?? null,
    createdBy: input.createdBy ?? null,
    title: input.title ?? null,
    caption: input.caption ?? null,
    videoId: input.videoId ?? null,
    storySourceId: input.storySourceId ?? null,
    storySourceKind: input.storySourceKind ?? null,
  });

  const publishJob = input.enqueueNow
    ? await enqueuePublishJob({
        shopId: input.shopId,
        publicationId: publication.id,
        runAfter: input.scheduledFor ?? null,
      })
    : null;

  return {
    publication,
    publishJob,
  };
}
