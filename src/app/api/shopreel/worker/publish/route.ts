import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processPublishJob } from "@/features/shopreel/publishing/lib/processPublishJob";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      jobId?: string;
    };

    const supabase = createAdminClient();
    let jobId = body.jobId ?? null;

    if (!jobId) {
      const { data: nextJob, error: nextJobError } = await supabase
        .from("shopreel_publish_jobs")
        .select("id")
        .eq("status", "queued")
        .lte("run_after", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextJobError) {
        return NextResponse.json({ error: nextJobError.message }, { status: 500 });
      }

      if (!nextJob?.id) {
        return NextResponse.json({ ok: true, message: "No queued publish jobs" });
      }

      jobId = nextJob.id;
    }

    const result = await processPublishJob(jobId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
