import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createAdminClient } from "@/lib/supabase/server";
import { appendBrandedCtaCard } from "./ctaComposition";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code ?? "unknown"}`));
    });
    child.on("error", reject);
  });
}

export async function assembleCampaignItemVideo(campaignItemId: string) {
  const supabase = createAdminClient();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("id", campaignItemId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs (*)
    `)
    .eq("campaign_item_id", campaignItemId)
    .eq("shop_id", item.shop_id)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  const normalizedScenes = (scenes ?? []).map((scene) => ({
    ...scene,
    media_job: Array.isArray(scene.media_job) ? scene.media_job[0] ?? null : scene.media_job,
  }));

  const incomplete = normalizedScenes.filter(
    (scene) => scene.media_job?.status !== "completed" || !scene.media_job?.output_asset_id
  );

  if (incomplete.length > 0) {
    throw new Error("All scene media jobs must be completed before assembly.");
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "shopreel-assemble-"));
  await mkdir(tempDir, { recursive: true });

  const localFiles: string[] = [];

  for (let i = 0; i < normalizedScenes.length; i++) {
    const scene = normalizedScenes[i];
    const mediaJob = scene.media_job!;
    const assetId = mediaJob.output_asset_id!;

    const { data: asset, error: assetError } = await supabase
      .from("content_assets")
      .select("*")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      throw new Error(assetError?.message ?? "Could not load scene output asset");
    }

    if (!asset.bucket || !asset.storage_path) {
      throw new Error("Scene output asset is missing bucket or storage path.");
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from(asset.bucket)
      .download(asset.storage_path);

    if (downloadError || !blob) {
      throw new Error(downloadError?.message ?? "Could not download scene output asset");
    }

    const localPath = path.join(tempDir, `scene-${String(i + 1).padStart(2, "0")}.mp4`);
    await writeFile(localPath, Buffer.from(await blob.arrayBuffer()));
    localFiles.push(localPath);
  }

  const concatFile = path.join(tempDir, "concat.txt");
  await writeFile(
    concatFile,
    localFiles.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n") + "\n"
  );

  const assembledPath = path.join(tempDir, "assembled.mp4");

  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatFile,
    "-c",
    "copy",
    assembledPath,
  ]);

  const finalPath = path.join(tempDir, "assembled-final.mp4");

  await appendBrandedCtaCard({
    inputVideoPath: assembledPath,
    outputVideoPath: finalPath,
    workDir: path.join(tempDir, "cta"),
    title: "Turn Real Work Into Marketing",
    subtitle: "Create campaigns from everyday business activity",
    ctaLabel: "Start Free",
    brandLabel: "ShopReel by ProFixIQ",
    durationSeconds: 2,
    width: item.aspect_ratio === "16:9" ? 1920 : item.aspect_ratio === "1:1" ? 1080 : 1080,
    height: item.aspect_ratio === "16:9" ? 1080 : item.aspect_ratio === "1:1" ? 1080 : 1920,
  });

  const finalBuffer = await readFile(finalPath);
  const storagePath = `shopreel/campaign-assembled/${campaignItemId}-assembled.mp4`;

  const bucket = process.env.SHOPREEL_GENERATED_MEDIA_BUCKET!;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, finalBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  const { data: asset, error: insertAssetError } = await supabase
    .from("content_assets")
    .insert({
      tenant_shop_id: item.shop_id,
      source_shop_id: item.shop_id,
      source_system: "shopreel",
      asset_type: "video",
      bucket,
      storage_path: storagePath,
      file_name: `${campaignItemId}-assembled.mp4`,
      mime_type: "video/mp4",
      public_url: publicUrlData.publicUrl,
      metadata: {
        campaign_item_id: campaignItemId,
        variant: "assembled_multiscene_with_cta",
      },
    })
    .select("*")
    .single();

  if (insertAssetError || !asset) {
    throw new Error(insertAssetError?.message ?? "Could not create assembled asset");
  }

  const { error: updateItemError } = await supabase
    .from("shopreel_campaign_items")
    .update({
      output_asset_id: asset.id,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignItemId);

  if (updateItemError) {
    throw new Error(updateItemError.message);
  }

  await rm(tempDir, { recursive: true, force: true });

  return asset;
}
