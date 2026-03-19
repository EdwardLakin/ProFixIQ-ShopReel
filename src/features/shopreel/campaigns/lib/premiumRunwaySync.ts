import { createAdminClient } from "@/lib/supabase/server";
import { getRunwayTask } from "@/features/shopreel/video-creation/providers/runway";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Json } from "@/types/supabase";

export async function syncPremiumRunwaySceneJob(mediaJobId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: mediaJob, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("id", mediaJobId)
    .eq("shop_id", shopId)
    .single();

  if (error || !mediaJob) {
    throw new Error(error?.message ?? "Media job not found");
  }

  const taskId = mediaJob.provider_job_id;
  if (!taskId) {
    throw new Error("Missing provider_job_id");
  }

  const task = await getRunwayTask(taskId);
  const taskStatus = String((task as { status?: string }).status ?? "PENDING").toUpperCase();

  const resultPayload =
    mediaJob.result_payload &&
    typeof mediaJob.result_payload === "object" &&
    !Array.isArray(mediaJob.result_payload)
      ? { ...(mediaJob.result_payload as Record<string, Json | undefined>) }
      : {};

  resultPayload.provider_status = taskStatus;
  resultPayload.runway_task = task as unknown as Json;

  if (taskStatus === "SUCCEEDED") {
    const videoUrl =
      (task as { output?: Array<{ url?: string }> }).output?.[0]?.url ?? null;

    const { error: updateError } = await supabase
      .from("shopreel_media_generation_jobs")
      .update({
        status: "completed",
        preview_url: videoUrl,
        completed_at: new Date().toISOString(),
        result_payload: resultPayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaJob.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { status: "completed", previewUrl: videoUrl };
  }

  if (taskStatus === "FAILED" || taskStatus === "CANCELLED") {
    const { error: updateError } = await supabase
      .from("shopreel_media_generation_jobs")
      .update({
        status: "failed",
        error_text: `Runway task ${taskStatus}`,
        result_payload: resultPayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mediaJob.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { status: "failed", previewUrl: null };
  }

  const { error: updateError } = await supabase
    .from("shopreel_media_generation_jobs")
    .update({
      status: "processing",
      result_payload: resultPayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaJob.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { status: "processing", previewUrl: null };
}
