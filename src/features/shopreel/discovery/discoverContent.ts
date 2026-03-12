import { createAdminClient } from "@/lib/supabase/server";
import { storySourceFromOpportunity } from "../story-sources";
import type { StorySource } from "../story-sources";
import type { Tables } from "@/types/supabase";

type ContentAssetRow = Pick<
  Tables<"content_assets">,
  | "id"
  | "title"
  | "caption"
  | "asset_type"
  | "public_url"
  | "created_at"
  | "metadata"
  | "source_media_upload_id"
  | "source_work_order_id"
  | "source_inspection_id"
  | "source_vehicle_id"
>;

export type ContentOpportunity = {
  sourceType:
    | "manual_upload"
    | "content_asset"
    | "before_after_candidate"
    | "educational_candidate"
    | "video_story";
  workOrderId: string | null;
  sourceId: string;
  title: string;
  contentType:
    | "inspection_highlight"
    | "before_after"
    | "repair_story"
    | "educational_tip"
    | "workflow_demo";
  hook: string;
  reason: string;
  visualUrls: string[];
};

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function chooseContentType(row: ContentAssetRow): ContentOpportunity["contentType"] {
  const metadata = objectRecord(row.metadata);
  const explicit = typeof metadata.content_type === "string" ? metadata.content_type : null;
  const tags = getStringList(metadata.tags).map((tag) => tag.toLowerCase());

  if (explicit === "before_after" || tags.includes("before_after")) {
    return "before_after";
  }

  if (
    explicit === "educational_tip" ||
    explicit === "inspection_highlight" ||
    tags.includes("educational") ||
    tags.includes("tip")
  ) {
    return "educational_tip";
  }

  if (explicit === "repair_story" || tags.includes("repair")) {
    return "repair_story";
  }

  return row.asset_type === "video" ? "workflow_demo" : "before_after";
}

function chooseSourceType(
  row: ContentAssetRow,
  contentType: ContentOpportunity["contentType"],
): ContentOpportunity["sourceType"] {
  if (row.source_media_upload_id) return "manual_upload";
  if (contentType === "before_after") return "before_after_candidate";
  if (contentType === "educational_tip") return "educational_candidate";
  if (row.asset_type === "video") return "video_story";
  return "content_asset";
}

function buildTitle(row: ContentAssetRow, contentType: ContentOpportunity["contentType"]): string {
  if (row.title && row.title.trim().length > 0) return row.title.trim();

  switch (contentType) {
    case "before_after":
      return "Before / after story";
    case "educational_tip":
      return "Educational story";
    case "repair_story":
      return "Repair story";
    default:
      return row.asset_type === "video" ? "Video story" : "Photo story";
  }
}

function buildHook(
  row: ContentAssetRow,
  title: string,
  contentType: ContentOpportunity["contentType"],
): string {
  const metadata = objectRecord(row.metadata);
  const explicitHook = typeof metadata.hook === "string" ? metadata.hook.trim() : "";

  if (explicitHook.length > 0) return explicitHook;
  if (row.caption && row.caption.trim().length > 0) return row.caption.trim();

  switch (contentType) {
    case "before_after":
      return `${title} — here’s the transformation.`;
    case "educational_tip":
      return `${title} — here’s what to know.`;
    case "repair_story":
      return `${title} — here’s what happened.`;
    default:
      return `${title} — here’s the story.`;
  }
}

function buildReason(
  row: ContentAssetRow,
  sourceType: ContentOpportunity["sourceType"],
  contentType: ContentOpportunity["contentType"],
): string {
  if (sourceType === "manual_upload") return "Manual upload asset ready for story generation";
  if (contentType === "before_after") return "Asset metadata suggests a before/after story";
  if (contentType === "educational_tip") return "Asset metadata suggests an educational story";
  if (row.asset_type === "video") return "Video asset can be turned into a workflow story";
  return "Content asset available for story generation";
}

export async function discoverContent(shopId: string): Promise<ContentOpportunity[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_assets")
    .select(`
      id,
      title,
      caption,
      asset_type,
      public_url,
      created_at,
      metadata,
      source_media_upload_id,
      source_work_order_id,
      source_inspection_id,
      source_vehicle_id
    `)
    .eq("tenant_shop_id", shopId)
    .in("asset_type", ["photo", "video"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const rows: ContentAssetRow[] = data ?? [];

  const opportunities = rows.map((row) => {
    const contentType = chooseContentType(row);
    const sourceType = chooseSourceType(row, contentType);
    const title = buildTitle(row, contentType);

    return {
      sourceType,
      workOrderId: row.source_work_order_id,
      sourceId: row.id,
      title,
      contentType,
      hook: buildHook(row, title, contentType),
      reason: buildReason(row, sourceType, contentType),
      visualUrls: row.public_url ? [row.public_url] : [],
    } satisfies ContentOpportunity;
  });

  return opportunities.slice(0, 20);
}

export async function discoverStorySources(shopId: string): Promise<StorySource[]> {
  const opportunities = await discoverContent(shopId);
  return opportunities.map((opportunity) => storySourceFromOpportunity(shopId, opportunity));
}
