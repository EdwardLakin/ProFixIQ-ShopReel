import { createAdminClient } from "@/lib/supabase/server";
import type { StorySource } from "../../story-sources";

export type ManualAssetOpportunity = {
  ok: true;
  assetId: string;
  videoId: string;
  title: string;
  contentType: string;
  status: string;
  aiScore: number | null;
  source: "manual_upload";
};

export async function createOpportunityFromManualAsset(
  assetId: string,
): Promise<ManualAssetOpportunity> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_assets")
    .select("id, title, asset_type, metadata, created_at, public_url, storage_path")
    .eq("id", assetId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "No manual asset found");
  }

  const metadata =
    data.metadata &&
    typeof data.metadata === "object" &&
    !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : {};

  const contentType =
    typeof metadata.content_type === "string"
      ? metadata.content_type
      : data.asset_type ?? "manual_upload";

  const aiScore =
    typeof metadata.ai_score === "number" ? metadata.ai_score : null;

  return {
    ok: true,
    assetId,
    videoId: data.id,
    title: data.title ?? "Manual upload",
    contentType,
    status: "ready",
    aiScore,
    source: "manual_upload",
  };
}

export async function createStorySourceFromManualAsset(
  shopId: string,
  assetId: string,
): Promise<StorySource> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_assets")
    .select("id, title, asset_type, metadata, created_at, public_url, storage_path, caption")
    .eq("id", assetId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "No manual asset found");
  }

  const metadata =
    data.metadata &&
    typeof data.metadata === "object" &&
    !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : {};

  const title =
    (typeof data.title === "string" && data.title.trim().length > 0
      ? data.title.trim()
      : null) ?? "Manual upload";

  const contentType =
    typeof metadata.content_type === "string"
      ? metadata.content_type
      : data.asset_type ?? "manual_upload";

  const tags = Array.isArray(metadata.tags)
    ? metadata.tags.filter((value): value is string => typeof value === "string")
    : [];

  return {
    id: `manual:${data.id}`,
    shopId,
    title,
    description:
      typeof data.caption === "string" && data.caption.trim().length > 0
        ? data.caption.trim()
        : null,
    kind: "manual_upload",
    origin: "manual_upload",
    generationMode: "manual",
    occurredAt: data.created_at ?? null,
    tags: Array.from(new Set(["manual_upload", contentType, ...tags].filter(Boolean))),
    assets: [
      {
        id: `manual-asset:${data.id}`,
        assetType: data.asset_type === "video" ? "video" : "photo",
        contentAssetId: data.id,
        url: data.public_url ?? null,
        title,
        caption:
          typeof data.caption === "string" && data.caption.trim().length > 0
            ? data.caption.trim()
            : null,
        takenAt: data.created_at ?? null,
        sortOrder: 0,
        metadata: {
          storage_path: data.storage_path ?? null,
          raw_metadata: metadata,
        },
      },
    ],
    refs: [
      {
        type: "content_asset",
        id: data.id,
      },
      {
        type: "manual_asset",
        id: data.id,
      },
    ],
    notes: [],
    facts: {
      contentType,
    },
    metadata: {
      source: "manual_upload",
      contentType,
      aiScore: typeof metadata.ai_score === "number" ? metadata.ai_score : null,
    },
    createdAt: data.created_at ?? undefined,
    updatedAt: data.created_at ?? undefined,
  };
}
