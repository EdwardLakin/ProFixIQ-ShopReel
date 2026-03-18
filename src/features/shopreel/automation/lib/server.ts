import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Json } from "@/types/supabase";

export async function startAutomationRun(args?: { runType?: string }) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_automation_runs")
    .insert({
      shop_id: shopId,
      run_type: args?.runType ?? "manual",
      status: "running",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to start automation run");
  }

  return data;
}

export async function completeAutomationRun(args: {
  runId: string;
  queuedJobsCount: number;
  processingJobsCount: number;
  syncedJobsCount: number;
  activeCampaignsCount: number;
  learningsCount: number;
  resultSummary: Json;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("shopreel_automation_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      queued_jobs_count: args.queuedJobsCount,
      processing_jobs_count: args.processingJobsCount,
      synced_jobs_count: args.syncedJobsCount,
      active_campaigns_count: args.activeCampaignsCount,
      learnings_count: args.learningsCount,
      result_summary: args.resultSummary,
    })
    .eq("id", args.runId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function failAutomationRun(args: {
  runId: string;
  errorText: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("shopreel_automation_runs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_text: args.errorText,
    })
    .eq("id", args.runId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getOperatorDashboardData() {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const [
    { count: queuedJobsCount, error: queuedError },
    { count: processingJobsCount, error: processingError },
    { count: activeCampaignsCount, error: campaignsError },
    { count: learningsCount, error: learningsError },
    { data: latestRuns, error: runsError },
    { data: latestJobs, error: jobsError },
    { data: latestCampaigns, error: latestCampaignsError },
  ] = await Promise.all([
    supabase
      .from("shopreel_media_generation_jobs")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .eq("status", "queued"),
    supabase
      .from("shopreel_media_generation_jobs")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .eq("status", "processing"),
    supabase
      .from("shopreel_campaigns")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .in("status", ["draft", "active", "running"]),
    supabase
      .from("shopreel_campaign_learnings")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId),
    supabase
      .from("shopreel_automation_runs")
      .select("*")
      .eq("shop_id", shopId)
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("shopreel_media_generation_jobs")
      .select("id, title, status, provider, job_type, created_at, updated_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("shopreel_campaigns")
      .select("id, title, status, created_at, updated_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  for (const err of [
    queuedError,
    processingError,
    campaignsError,
    learningsError,
    runsError,
    jobsError,
    latestCampaignsError,
  ]) {
    if (err) throw new Error(err.message);
  }

  return {
    summary: {
      queuedJobsCount: queuedJobsCount ?? 0,
      processingJobsCount: processingJobsCount ?? 0,
      activeCampaignsCount: activeCampaignsCount ?? 0,
      learningsCount: learningsCount ?? 0,
      lastAutomationRun: latestRuns?.[0] ?? null,
    },
    latestRuns: latestRuns ?? [],
    latestJobs: latestJobs ?? [],
    latestCampaigns: latestCampaigns ?? [],
  };
}
