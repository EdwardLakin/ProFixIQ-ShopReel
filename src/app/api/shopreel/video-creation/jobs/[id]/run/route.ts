import { NextResponse } from "next/server";
import { processMediaGenerationJob } from "@/features/shopreel/video-creation/lib/server";
import type { Database } from "@/types/supabase";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

function toClientJob(job: MediaJob) {
  return {
    ...job,
    id: job.id,
    title: job.title,
    status: job.status,
    provider: job.provider,
    job_type: job.job_type,
    style: job.style,
    duration_seconds: job.duration_seconds,
    created_at: job.created_at,
    preview_url: job.preview_url,
  };
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const job = await processMediaGenerationJob(id);

    return NextResponse.json({
      ok: true,
      job: toClientJob(job),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run media generation job",
      },
      { status: 500 }
    );
  }
}
