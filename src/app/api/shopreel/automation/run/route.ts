import { NextResponse } from "next/server";
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
        const processedJob = await processMediaGenerationJob(job.id);
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

    const { data: campaigns, error } = await supabase
      .from("shopreel_campaigns")
      .select("id, status")
      .eq("shop_id", shopId)
      .in("status", ["draft", "active", "running"]);

    if (error) {
      throw new Error(error.message);
    }

    const campaignResults = [];
    let totalLearningsInserted = 0;

    for (const campaign of campaigns ?? []) {
      const result = await runCampaignAutomationCycle(campaign.id);
      totalLearningsInserted += Number(result.learnings?.inserted ?? 0);
      campaignResults.push(result);
    }

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
      },
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
