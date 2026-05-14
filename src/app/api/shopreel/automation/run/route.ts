import { NextResponse } from "next/server";
import type { Json } from "@/types/supabase";
import { createAdminClient } from "@/lib/supabase/server";
import { syncAllProcessingVideoJobs } from "@/features/shopreel/video-creation/lib/automation";
import { processMediaGenerationJob } from "@/features/shopreel/video-creation/lib/server";
import { runCampaignAutomationCycle } from "@/features/shopreel/campaigns/lib/automation";
import {
  completeAutomationRun,
  failAutomationRun,
  startAutomationRun,
} from "@/features/shopreel/automation/lib/server";
import {
  requireInternalWorkerRequest,
  ShopReelEndpointError,
  toEndpointErrorResponse,
} from "@/features/shopreel/server/endpointPolicy";

type AutomationRunRequestBody = {
  shopId?: string;
};

export async function POST(req: Request) {
  let runId: string | null = null;

  try {
    requireInternalWorkerRequest(req, {
      envSecretName: "SHOPREEL_AUTOMATION_SECRET",
      errorMessage: "Unauthorized automation request",
    });

    const body = (await req.json().catch(() => ({}))) as AutomationRunRequestBody;
    const shopId = typeof body.shopId === "string" ? body.shopId.trim() : "";

    if (!shopId) {
      throw new ShopReelEndpointError(
        "shopId is required for internal automation runs",
        400,
      );
    }

    const run = await startAutomationRun({
      runType: "scheduled",
      shopId,
    });
    runId = run.id;

    const supabase = createAdminClient();

    const [{ count: queuedJobsCount }, { count: processingJobsCount }] = await Promise.all([
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
    ]);

    const { data: queuedJobs, error: queuedJobsError } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("id, provider, job_type, status")
      .eq("shop_id", shopId)
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(3);

    if (queuedJobsError) {
      throw new Error(queuedJobsError.message);
    }

    const queuedJobRunResults = [];

    for (const job of queuedJobs ?? []) {
      try {
        const processedJob = await processMediaGenerationJob(job.id, { shopId });
        queuedJobRunResults.push({
          jobId: job.id,
          ok: true,
          provider: processedJob.provider,
          jobType: processedJob.job_type,
          status: processedJob.status,
        });
      } catch (error) {
        queuedJobRunResults.push({
          jobId: job.id,
          ok: false,
          provider: job.provider,
          jobType: job.job_type,
          status: job.status,
          error: error instanceof Error ? error.message : "Failed to run queued job",
        });
      }
    }

    const videoSyncResults = await syncAllProcessingVideoJobs({ shopId });

    // Scheduled worker mode: keep this pass focused on media queue execution/sync.
    // Campaign automation still depends on user-session shop context in several helpers,
    // so do not run it from cron until those helpers accept explicit shopId.
    const campaigns: Array<{ id: string; status: string }> = [];
    const campaignResults: Json[] = [];
    const totalLearningsInserted = 0;

    await completeAutomationRun({
      runId,
      queuedJobsCount: queuedJobsCount ?? 0,
      processingJobsCount: processingJobsCount ?? 0,
      syncedJobsCount: videoSyncResults.filter((row) => row.ok).length,
      activeCampaignsCount: campaigns?.length ?? 0,
      learningsCount: totalLearningsInserted,
      resultSummary: {
        queuedJobRunResults,
        videoSyncResults,
        campaignResults,
      } satisfies Json,
    });

    return NextResponse.json({
      ok: true,
      queuedJobRunResults,
      videoSyncResults,
      campaignResults,
    });
  } catch (error) {
    if (runId) {
      await failAutomationRun({
        runId,
        errorText: error instanceof Error ? error.message : "Failed to run ShopReel automation",
      });
    }

    return toEndpointErrorResponse(error, "Failed to run ShopReel automation");
  }
}
