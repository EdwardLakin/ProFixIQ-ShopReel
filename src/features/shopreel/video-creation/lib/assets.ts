import fs from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isGeneratedAsset(metadata: unknown) {
  const obj = asObject(metadata);
  if (!obj) return false;

  const pipeline = typeof obj.pipeline === "string" ? obj.pipeline : "";
  const source = typeof obj.source === "string" ? obj.source : "";
  const generated = obj.generated === true;

  if (generated) return true;
  if (source === "generated") return true;

  return [
    "shopreel_premium_campaign",
    "shopreel_thumbnail",
    "shopreel_storyboard",
    "shopreel_video_generation",
    "shopreel_manual_series",
    "shopreel_series_output",
    "shopreel_generated_media",
  ].includes(pipeline);
}

function isManualOrSourceAsset(asset: {
  source_system: string | null;
  metadata: unknown;
  bucket: string | null;
  storage_path: string | null;
}) {
  if (isGeneratedAsset(asset.metadata)) return false;

  if (asset.source_system === "profixiq") return true;
  if (asset.source_system === "shopreel") {
    const bucket = asset.bucket ?? "";
    const storagePath = asset.storage_path ?? "";

    if (bucket === "shopreel-media") return true;
    if (storagePath.includes("/manual/")) return true;
    if (storagePath.includes("/uploads/")) return true;

    const obj = asObject(asset.metadata);
    const origin = obj && typeof obj.origin === "string" ? obj.origin : "";
    if (origin === "manual_upload") return true;
    if (origin === "source_media") return true;

    return false;
  }

  return false;
}

export async function listSelectableContentAssets(limit = 100) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("content_assets")
    .select("*")
    .eq("tenant_shop_id", shopId)
    .in("asset_type", ["photo", "video"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter((asset) => isManualOrSourceAsset(asset));
}

export async function uploadLocalFileToGeneratedMedia(input: {
  shopId: string;
  localFilePath: string;
  fileName: string;
  title?: string | null;
  mimeType?: string;
}) {
  const supabase = createAdminClient();
  const fileBytes = await fs.readFile(input.localFilePath);

  const bucket = "shopreel-generated-media";
  const storagePath = `${input.shopId}/premium/${Date.now()}-${input.fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBytes, {
      contentType: input.mimeType ?? "video/mp4",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  const stats = await fs.stat(input.localFilePath);

  const { data: asset, error: assetError } = await supabase
    .from("content_assets")
    .insert({
      tenant_shop_id: input.shopId,
      source_shop_id: input.shopId,
      source_system: "shopreel",
      asset_type: "video",
      bucket,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      mime_type: input.mimeType ?? "video/mp4",
      file_size_bytes: stats.size,
      title: input.title ?? path.basename(input.localFilePath),
      metadata: {
        pipeline: "shopreel_premium_campaign",
        generated: true,
        source: "generated",
      },
    })
    .select("*")
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message ?? "Failed to create content asset");
  }

  return asset;
}
