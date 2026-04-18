import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  ACTIVE_PUBLISH_JOB_STATUSES,
} from "@/features/shopreel/lib/contracts/lifecycle";
import {
  requireUserActionTenantContext,
  toEndpointErrorResponse,
} from "@/features/shopreel/server/endpointPolicy";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: job, error: jobError } = await legacy
      .from("shopreel_publish_jobs")
      .select("*")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (jobError) {
      throw new Error(jobError.message);
    }

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "Publish job not found" },
        { status: 404 }
      );
    }

    if (!ACTIVE_PUBLISH_JOB_STATUSES.includes(job.status)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Publish job is not actionable from status ${job.status}`,
        },
        { status: 400 }
      );
    }

    const workerSecret = process.env.SHOPREEL_WORKER_SECRET;

    const workerRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/shopreel/worker/publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(workerSecret
            ? {
                "x-shopreel-worker-secret": workerSecret,
              }
            : {}),
        },
        body: JSON.stringify({ jobId: id, shopId }),
      }
    );

    const workerJson = await workerRes.json().catch(() => ({}));

    if (!workerRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            typeof workerJson?.error === "string"
              ? workerJson.error
              : "Publish worker failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      jobId: id,
      worker: workerJson,
    });
  } catch (error) {
    return toEndpointErrorResponse(error, "Failed to run publish job");
  }
}
