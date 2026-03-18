import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/server";
import { appendBrandedCtaCard } from "./ctaComposition";
import type { Database } from "@/types/supabase";

type MediaJobRow = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

export async function finalizeVideoWithCta(mediaJob: MediaJobRow) {
  if (!mediaJob.output_asset_id) {
    throw new Error("Media job does not have an output asset yet.");
  }

  const supabase = createAdminClient();

  const { data: asset, error: assetError } = await supabase
    .from("content_assets")
    .select("*")
    .eq("id", mediaJob.output_asset_id)
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message ?? "Could not load output asset");
  }

  if (!asset.bucket || !asset.storage_path) {
    throw new Error("Output asset is missing bucket or storage path.");
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(asset.bucket)
    .download(asset.storage_path);

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message ?? "Could not download output asset");
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shopreel-finalize-"));
  const inputPath = path.join(tempDir, "input.mp4");
  const outputPath = path.join(tempDir, "final.mp4");

  await writeFile(inputPath, Buffer.from(await fileData.arrayBuffer()));

  await appendBrandedCtaCard({
    inputVideoPath: inputPath,
    outputVideoPath: outputPath,
    workDir: path.join(tempDir, "cta"),
    title: "Turn Real Work Into Marketing",
    subtitle: "Create campaigns from everyday business activity",
    ctaLabel: "Start Free",
    brandLabel: "ShopReel by ProFixIQ",
    durationSeconds: 2,
    width: mediaJob.aspect_ratio === "16:9" ? 1920 : mediaJob.aspect_ratio === "1:1" ? 1080 : 1080,
    height: mediaJob.aspect_ratio === "16:9" ? 1080 : mediaJob.aspect_ratio === "1:1" ? 1080 : 1920,
  });

  const finalBuffer = await readFile(outputPath);

  const finalPath = `shopreel/final-videos/${mediaJob.id}-final.mp4`;

  const { error: uploadError } = await supabase.storage
    .from(process.env.SHOPREEL_GENERATED_MEDIA_BUCKET!)
    .upload(finalPath, finalBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(process.env.SHOPREEL_GENERATED_MEDIA_BUCKET!)
    .getPublicUrl(finalPath);

  const { data: insertedAsset, error: insertAssetError } = await supabase
    .from("content_assets")
    .insert({
      tenant_shop_id: mediaJob.shop_id,
      source_shop_id: mediaJob.shop_id,
      source_system: "shopreel",
      asset_type: "video",
      bucket: process.env.SHOPREEL_GENERATED_MEDIA_BUCKET!,
      storage_path: finalPath,
      file_name: `${mediaJob.id}-final.mp4`,
      mime_type: "video/mp4",
      public_url: publicUrlData.publicUrl,
      metadata: {
        generated_from_media_job_id: mediaJob.id,
        variant: "final_with_cta",
      },
    })
    .select("*")
    .single();

  if (insertAssetError || !insertedAsset) {
    throw new Error(insertAssetError?.message ?? "Could not create final asset row");
  }

  const { error: updateError } = await supabase
    .from("shopreel_media_generation_jobs")
    .update({
      preview_url: publicUrlData.publicUrl,
      output_asset_id: insertedAsset.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaJob.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  await rm(tempDir, { recursive: true, force: true });

  return insertedAsset;
}
