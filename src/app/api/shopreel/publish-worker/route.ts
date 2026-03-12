import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { processPublishJob } from "@/features/shopreel/publishing/lib/processPublishJob";

export async function POST() {
  try {
    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data: jobs, error } = await legacy
      .from("shopreel_publish_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) {
      throw new Error(error.message);
    }

    if (!jobs?.length) {
      return NextResponse.json({
        ok: true,
        processed: 0,
      });
    }

    const results = [];
    for (const job of jobs) {
      const result = await processPublishJob(job.id);
      results.push({
        jobId: job.id,
        publicationId: result.publicationId,
      });
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process publish jobs";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
