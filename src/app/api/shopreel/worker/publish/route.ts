import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processPublishJob } from "@/features/shopreel/publishing/lib/processPublishJob";

type PublishWorkerRequestBody = {
  jobId?: string;
};

type PublishJobRow = {
  id: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PublishWorkerRequestBody;

    const supabase = createAdminClient();
    let jobId =
      typeof body.jobId === "string" && body.jobId.length > 0 ? body.jobId : null;

    if (!jobId) {
      const { data: nextJobData, error: nextJobError } = await supabase
        .from("shopreel_publish_jobs")
        .select("id")
        .eq("status", "queued")
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
          message: "No queued publish jobs",
        });
      }

      jobId = nextJob.id;
    }

    const result = await processPublishJob(jobId);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}