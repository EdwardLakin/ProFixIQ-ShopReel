import { NextResponse } from "next/server";
import { createMediaGenerationJob, listRecentMediaGenerationJobs } from "@/features/shopreel/video-creation/lib/server";
import type { VideoCreationFormInput } from "@/features/shopreel/video-creation/lib/types";
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawLimit = Number(searchParams.get("limit") ?? 24);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 24;
    const jobs = await listRecentMediaGenerationJobs(limit);

    return NextResponse.json({
      ok: true,
      jobs: jobs.map(toClientJob),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to list media generation jobs",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VideoCreationFormInput;

    const job = await createMediaGenerationJob(body);

    return NextResponse.json({
      ok: true,
      job: toClientJob(job),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create media generation job",
      },
      { status: 500 }
    );
  }
}
