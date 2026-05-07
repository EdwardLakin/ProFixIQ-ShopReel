import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  buildOpenAIVideoSyncMetadata,
  downloadOpenAIVideoContent,
  fetchOpenAIVideoStatus,
  uploadGeneratedVideoToStorage,
} from "@/features/shopreel/video-creation/lib/openaiVideo";
import { fetchRailwayVideoJob } from "@/features/shopreel/video-creation/lib/railwayClient";
import { finalizeCompletedMediaJob } from "@/features/shopreel/video-creation/lib/server";
import { normalizeVideoJobStatus } from "@/features/shopreel/video-creation/lib/status";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();

    const { data: mediaJob, error } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !mediaJob) {
      throw new Error(error?.message ?? "Media job not found");
    }

    if (mediaJob.job_type !== "video") {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "Sync currently only applies to video jobs.",
      });
    }

    if (!mediaJob.provider_job_id) {
      throw new Error("Media job is missing provider_job_id");
    }

    if (mediaJob.provider === "openai") {
      const status = await fetchRailwayVideoJob(mediaJob.provider_job_id);
      const normalized = normalizeVideoJobStatus(status.status);
      if (normalized === "queued" || normalized === "submitted" || normalized === "processing" || normalized === "rendering") {
        await supabase.from("shopreel_media_generation_jobs").update({ status: normalized === "queued" ? "submitted" : "rendering", updated_at: new Date().toISOString() }).eq("id", mediaJob.id);
        return NextResponse.json({ ok: true, completed: false, job: mediaJob });
      }
      if (normalized === "failed") {
        const { data: failedJob } = await supabase.from("shopreel_media_generation_jobs").update({ status: "failed", error_text: status.error ?? "Railway generation failed", failed_at: new Date().toISOString(), completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any).eq("id", mediaJob.id).select("*").single();
        return NextResponse.json({ ok: true, completed: false, failed: true, job: failedJob });
      }
      if (normalized === "completed") {
        const previewUrl = status.previewUrl ?? null;
        if (!previewUrl) {
          throw new Error("Railway marked job completed but returned no output URL.");
        }
        const completedJob = await finalizeCompletedMediaJob({
          completedJob: mediaJob,
          providerResult: { providerJobId: mediaJob.provider_job_id, previewUrl, resultPayload: { provider: "railway", railway_job_id: status.id, railway_status: status.status ?? "unknown", error: status.error ?? null } },
        });
        return NextResponse.json({ ok: true, completed: true, job: completedJob });
      }
      throw new Error(`Unexpected Railway video status: ${status.status ?? "unknown"}`);
    }

    const status = await fetchOpenAIVideoStatus(mediaJob.provider_job_id);

    if (status.status === "queued" || status.status === "in_progress") {
      const { data: updatedJob, error: updateError } = await supabase
        .from("shopreel_media_generation_jobs")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
          result_payload: buildOpenAIVideoSyncMetadata(status),
        })
        .eq("id", mediaJob.id)
        .select("*")
        .single();

      if (updateError || !updatedJob) {
        throw new Error(updateError?.message ?? "Failed to update media job sync status");
      }

      return NextResponse.json({
        ok: true,
        completed: false,
        job: updatedJob,
      });
    }

    if (status.status === "failed") {
      const { data: failedJob, error: failedError } = await supabase
        .from("shopreel_media_generation_jobs")
        .update({
          status: "failed",
          error_text: status.error?.message ?? "OpenAI video generation failed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          result_payload: buildOpenAIVideoSyncMetadata(status),
        })
        .eq("id", mediaJob.id)
        .select("*")
        .single();

      if (failedError || !failedJob) {
        throw new Error(failedError?.message ?? "Failed to update failed media job");
      }

      return NextResponse.json({
        ok: true,
        completed: false,
        failed: true,
        job: failedJob,
      });
    }

    if (status.status !== "completed") {
      throw new Error(`Unexpected OpenAI video status: ${status.status ?? "unknown"}`);
    }

    const bytes = await downloadOpenAIVideoContent(mediaJob.provider_job_id);
    const storage = await uploadGeneratedVideoToStorage({
      mediaJob,
      videoBytes: bytes,
    });

    const completedJob = await finalizeCompletedMediaJob({
      completedJob: mediaJob,
      providerResult: {
        providerJobId: mediaJob.provider_job_id,
        previewUrl: storage.publicUrl,
        resultPayload: buildOpenAIVideoSyncMetadata(status),
      },
      storage,
    });

    return NextResponse.json({
      ok: true,
      completed: true,
      job: completedJob,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to sync video job",
      },
      { status: 500 }
    );
  }
}
