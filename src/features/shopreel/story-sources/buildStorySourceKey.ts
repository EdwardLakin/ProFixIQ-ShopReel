import type { StorySource, StorySourceAsset } from "./types"

function compactParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (part ?? "").trim().toLowerCase())
    .filter(Boolean)
    .join("::")
}

function assetFingerprint(asset: StorySourceAsset): string {
  return compactParts([
    asset.assetType,
    asset.contentAssetId ?? null,
    asset.manualAssetId ?? null,
    asset.url ?? null,
    asset.takenAt ?? null,
    String(asset.sortOrder),
  ])
}

export function buildStorySourceKey(
  source: Pick<
    StorySource,
    "shopId" | "kind" | "origin" | "title" | "occurredAt" | "projectId" | "assets"
  >,
): string {
  const assetBits = source.assets
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(assetFingerprint)
    .join("|")

  return compactParts([
    source.shopId,
    source.kind,
    source.origin,
    source.title,
    source.projectId ?? null,
    source.occurredAt ?? null,
    assetBits,
  ])
}
