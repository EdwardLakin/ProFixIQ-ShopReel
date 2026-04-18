import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processPublishJob } from "@/features/shopreel/publishing/lib/processPublishJob";
import {
  ACTIVE_PUBLISH_JOB_STATUSES,
  QUEUED_PUBLISH_JOB_STATUS,
} from "@/features/shopreel/lib/contracts/lifecycle";
import {
  requireInternalWorkerRequest,
  requireUserActionTenantContext,
  ShopReelEndpointError,
  toEndpointErrorResponse,
} from "@/features/shopreel/server/endpointPolicy";

type PublishWorkerRequestBody = {
  jobId?: string;
  shopId?: string;
};

type PublishJobRow = {
  id: string;
  shop_id: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PublishWorkerRequestBody;
    const requestedShopId = typeof body.shopId === "string" ? body.shopId.trim() : "";

    const hasWorkerSecret = Boolean(process.env.SHOPREEL_WORKER_SECRET);
    const internalScope = hasWorkerSecret
      ? requireInternalWorkerRequest(req, {
          envSecretName: "SHOPREEL_WORKER_SECRET",
          errorMessage: "Unauthorized publish worker request",
        })
      : null;

    const userScope = internalScope ? null : await requireUserActionTenantContext();
    const resolvedShopId = internalScope
      ? requestedShopId
      : userScope?.shopId ?? "";

    if (!resolvedShopId) {
      throw new ShopReelEndpointError(
        "shopId is required for internal publish worker requests",
        400,
      );
    }

    if (userScope && requestedShopId && requestedShopId !== userScope.shopId) {
      throw new ShopReelEndpointError(
        "shopId override is not allowed for this endpoint.",
        403,
      );
    }

    const supabase = createAdminClient();
    let jobId =
      typeof body.jobId === "string" && body.jobId.length > 0 ? body.jobId : null;

    if (!jobId) {
      const { data: nextJobData, error: nextJobError } = await supabase
        .from("shopreel_publish_jobs")
        .select("id, shop_id")
        .eq("shop_id", resolvedShopId)
        .eq("status", QUEUED_PUBLISH_JOB_STATUS)
        .lte("run_after", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const nextJob = nextJobData as PublishJobRow | null;

      if (nextJobError) {
        return NextResponse.json(
          { ok: false, error: nextJobError.message },
          { status: 500 },
        );
      }

      if (!nextJob?.id) {
        return NextResponse.json({
          ok: true,
          shopId: resolvedShopId,
          message: "No queued publish jobs",
        });
      }

      jobId = nextJob.id;
    }

    const { data: jobData, error: jobError } = await supabase
      .from("shopreel_publish_jobs")
      .select("id, shop_id, status")
      .eq("id", jobId)
      .eq("shop_id", resolvedShopId)
      .maybeSingle();

    if (jobError) {
      throw new Error(jobError.message);
    }

    const job = jobData as (PublishJobRow & { status: string }) | null;

    if (!job?.id) {
      throw new ShopReelEndpointError("Publish job not found for shop scope", 404);
    }

    if (!(ACTIVE_PUBLISH_JOB_STATUSES as readonly string[]).includes(job.status)) {
      throw new ShopReelEndpointError(
        `Publish job is not actionable from status ${job.status}`,
        400,
      );
    }

    const result = await processPublishJob(jobId, { shopId: resolvedShopId });

    return NextResponse.json({
      ok: true,
      shopId: resolvedShopId,
      result,
    });
  } catch (error) {
    return toEndpointErrorResponse(error, "Unexpected error");
  }
}
