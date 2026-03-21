import { supabase } from "../lib/supabase.js";
import { env } from "../lib/env.js";

type AssemblyJobRow = {
  id: string;
  shop_id: string;
  campaign_id: string;
  campaign_item_id: string;
  status: string;
  settings: Record<string, unknown>;
};

async function claimNextJob(): Promise<AssemblyJobRow | null> {
  const { data: job } = await supabase
    .from("shopreel_premium_assembly_jobs")
    .select("*")
    .in("status", ["queued", "failed"])
    .lte("run_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!job) return null;

  const { data: claimed } = await supabase
    .from("shopreel_premium_assembly_jobs")
    .update({
      status: "processing",
      locked_at: new Date().toISOString(),
      locked_by: env.workerId,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attempt_count: (job.attempt_count ?? 0) + 1,
      error_text: null
    })
    .eq("id", job.id)
    .eq("status", job.status)
    .select("*")
    .maybeSingle();

  return (claimed as AssemblyJobRow | null) ?? null;
}

async function markFailed(jobId: string, errorText: string) {
  await supabase
    .from("shopreel_premium_assembly_jobs")
    .update({
      status: "failed",
      error_text: errorText,
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);
}

async function markCompleted(jobId: string, finalOutputAssetId: string | null, resultPayload: Record<string, unknown>) {
  await supabase
    .from("shopreel_premium_assembly_jobs")
    .update({
      status: "completed",
      final_output_asset_id: finalOutputAssetId,
      result_payload: resultPayload,
      completed_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", jobId);
}

export async function processNextPremiumAssemblyJob(): Promise<boolean> {
  const job = await claimNextJob();
  if (!job) return false;

  try {
    console.log(`[assembly-worker] claimed job ${job.id} for item ${job.campaign_item_id}`);

    // Placeholder processing phase.
    // Next pass will replace this block with:
    // 1) fetch completed scene assets
    // 2) download scene videos
    // 3) stitch with ffmpeg
    // 4) generate voiceover
    // 5) mux final
    // 6) upload content asset
    // 7) update campaign item final_output_asset_id
    //
    // For now, intentionally fail with a clear message until wiring is added.
    throw new Error("Worker scaffold is running. Premium assembly execution logic not wired yet.");

  } catch (error) {
    const message = error instanceof Error ? error.message : "Assembly failed";
    await markFailed(job.id, message);
    console.error(`[assembly-worker] failed job ${job.id}: ${message}`);
  }

  return true;
}

export async function runWorkerLoop() {
  console.log("[assembly-worker] started");
  while (true) {
    try {
      const found = await processNextPremiumAssemblyJob();
      if (!found) {
        await new Promise((resolve) => setTimeout(resolve, env.pollIntervalMs));
      }
    } catch (error) {
      console.error("[assembly-worker] loop error", error);
      await new Promise((resolve) => setTimeout(resolve, env.pollIntervalMs));
    }
  }
}
