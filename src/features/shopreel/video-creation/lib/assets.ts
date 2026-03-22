import fs from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isGeneratedAsset(metadata: unknown) {
  if (!isPlainObject(metadata)) return false;

  const pipeline = typeof metadata.pipeline === "string" ? metadata.pipeline : null;
  const source = typeof metadata.source === "string" ? metadata.source : null;
  const generated = metadata.generated === true;

  if (generated) return true;
  if (source === "generated") return true;

  return [
    "shopreel_premium_campaign",
    "shopreel_thumbnail",
    "shopreel_storyboard",
    "shopreel_video_generation",
    "shopreel_manual_series",
  ].includes(pipeline ?? "");
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

  return (data ?? []).filter((asset) => !isGeneratedAsset(asset.metadata));
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
