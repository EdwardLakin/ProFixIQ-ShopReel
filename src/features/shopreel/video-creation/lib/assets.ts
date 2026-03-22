import fs from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isManualUploadAsset(metadata: unknown) {
  const meta = asObject(metadata);
  const pipeline = typeof meta.pipeline === "string" ? meta.pipeline : null;
  const source = typeof meta.source === "string" ? meta.source : null;
  const origin = typeof meta.origin === "string" ? meta.origin : null;

  return (
    pipeline === "manual_upload" ||
    pipeline === "shopreel_manual_upload" ||
    source === "manual_upload" ||
    source === "manual_asset" ||
    origin === "manual_upload" ||
    origin === "manual_asset"
  );
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

  return (data ?? []).filter((asset) => {
    if (!asset.public_url) return false;
    return isManualUploadAsset(asset.metadata);
  });
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
      },
    })
    .select("*")
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message ?? "Failed to create content asset");
  }

  return asset;
}
