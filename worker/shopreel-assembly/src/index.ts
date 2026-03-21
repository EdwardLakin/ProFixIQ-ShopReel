import "dotenv/config";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { assemblePremiumCampaignItem } from "./lib/premiumAssembly.js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
}
if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const WORKER_ID =
  process.env.ASSEMBLY_WORKER_ID ??
  `assembly-${Math.random().toString(36).slice(2)}`;

const GENERATED_BUCKET =
  process.env.SHOPREEL_GENERATED_MEDIA_BUCKET ?? "shopreel-generated-media";

console.log(`[assembly-worker] started (${WORKER_ID})`);

async function claimJob() {
  const { data, error } = await supabase
    .from("shopreel_premium_assembly_jobs")
    .select("*")
    .eq("status", "queued")
    .lte("run_after", new Date().toISOString())
    .is("locked_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[worker] claim query error", error);
    return null;
  }
  if (!data) return null;

  const { data: locked, error: lockError } = await supabase
    .from("shopreel_premium_assembly_jobs")
    .update({
      locked_at: new Date().toISOString(),
      locked_by: WORKER_ID,
      status: "processing",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attempt_count: (data.attempt_count ?? 0) + 1,
      error_text: null,
    })
    .eq("id", data.id)
    .is("locked_at", null)
    .select("*")
    .maybeSingle();

  if (lockError) {
    console.error("[worker] lock error", lockError);
    return null;
  }

  return locked ?? null;
}

async function downloadSceneToFile(args: {
  bucket: string;
  storagePath: string;
  outPath: string;
}) {
  const { data, error } = await supabase.storage
    .from(args.bucket)
    .download(args.storagePath);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download scene asset");
  }

  const buf = Buffer.from(await data.arrayBuffer());
  await fs.writeFile(args.outPath, buf);
}

async function uploadFinalVideo(args: {
  shopId: string;
  localFilePath: string;
  fileName: string;
  title: string;
  metadata: Record<string, unknown>;
}) {
  const fileBytes = await fs.readFile(args.localFilePath);
  const stats = await fs.stat(args.localFilePath);

  const storagePath = `${args.shopId}/premium/${Date.now()}-${args.fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(GENERATED_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from(GENERATED_BUCKET)
    .getPublicUrl(storagePath);

  const { data: asset, error: assetError } = await supabase
    .from("content_assets")
    .insert({
      tenant_shop_id: args.shopId,
      source_shop_id: args.shopId,
      source_system: "shopreel",
      asset_type: "video",
      bucket: GENERATED_BUCKET,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      mime_type: "video/mp4",
      file_size_bytes: stats.size,
      title: args.title,
      metadata: args.metadata,
    })
    .select("*")
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message ?? "Failed to create content asset");
  }

  return asset;
}

async function processJob(job: any) {
  console.log(`[worker] processing job ${job.id}`);

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `shopreel-assembly-${job.id}-`)
  );

  try {
    const { data: item, error: itemError } = await supabase
      .from("shopreel_campaign_items")
      .select("*")
      .eq("id", job.campaign_item_id)
      .single();

    if (itemError || !item) {
      throw new Error(itemError?.message ?? "Campaign item not found");
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("shopreel_campaigns")
      .select("*")
      .eq("id", job.campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error(campaignError?.message ?? "Campaign not found");
    }

    const { data: scenes, error: scenesError } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select(`
        *,
        output_asset:content_assets!shopreel_campaign_item_scenes_output_asset_id_fkey(*)
      `)
      .eq("campaign_item_id", job.campaign_item_id)
      .order("scene_order", { ascending: true });

    if (scenesError || !scenes) {
      throw new Error(scenesError?.message ?? "Failed to load campaign scenes");
    }

    const completedScenes = scenes.filter(
      (scene: any) =>
        scene.status === "completed" &&
        scene.output_asset &&
        scene.output_asset.bucket &&
        scene.output_asset.storage_path
    );

    if (completedScenes.length === 0) {
      throw new Error("No completed scene assets available for assembly");
    }

    const localScenes = [];
    for (let index = 0; index < completedScenes.length; index += 1) {
      const scene = completedScenes[index];
      const localPath = path.join(tempDir, `scene-${index + 1}.mp4`);

      await downloadSceneToFile({
        bucket: scene.output_asset.bucket,
        storagePath: scene.output_asset.storage_path,
        outPath: localPath,
      });

      localScenes.push({
        title: scene.title,
        prompt: scene.prompt,
        localVideoPath: localPath,
      });
    }

    const assembly = await assemblePremiumCampaignItem({
      workDir: tempDir,
      campaignTitle: campaign.title,
      angle: item.angle,
      audience: campaign.audience,
      offer: campaign.offer,
      goal: campaign.campaign_goal,
      scenes: localScenes,
      outputBaseName: `${job.campaign_item_id}`,
    });

    const finalAsset = await uploadFinalVideo({
      shopId: item.shop_id,
      localFilePath: assembly.finalVideo,
      fileName: `${job.campaign_item_id}-premium-final.mp4`,
      title: `${item.title} Final Ad`,
      metadata: {
        pipeline: "shopreel_premium_campaign",
        campaign_id: campaign.id,
        campaign_item_id: item.id,
        assembly_job_id: job.id,
        voiceover_script: assembly.script,
      },
    });

    const { error: updateItemError } = await supabase
      .from("shopreel_campaign_items")
      .update({
        final_output_asset_id: finalAsset.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (updateItemError) {
      throw new Error(updateItemError.message);
    }

    const { error: completeError } = await supabase
      .from("shopreel_premium_assembly_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        final_output_asset_id: finalAsset.id,
        result_payload: {
          ok: true,
          worker_id: WORKER_ID,
          final_asset_id: finalAsset.id,
          final_public_url: finalAsset.public_url,
          voiceover_script: assembly.script,
        },
      })
      .eq("id", job.id);

    if (completeError) {
      throw new Error(completeError.message);
    }

    console.log(`[worker] completed job ${job.id}`);
  } catch (err: any) {
    console.error(`[worker] failed job ${job.id}`, err);

    await supabase
      .from("shopreel_premium_assembly_jobs")
      .update({
        status: "failed",
        error_text: err?.message ?? "unknown error",
        updated_at: new Date().toISOString(),
        locked_at: null,
        locked_by: null,
      })
      .eq("id", job.id);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function loop() {
  while (true) {
    try {
      const job = await claimJob();
      if (job) {
        await processJob(job);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (err) {
      console.error("[worker] loop error", err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

loop().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
