import { createAdminClient } from "@/lib/supabase/server";
import { createRunwaySceneJob } from "@/features/shopreel/video-creation/providers/runway";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Json } from "@/types/supabase";

function getPromptImageFromScene(_scene: {
  title: string;
  prompt: string;
}) {
  return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=720&q=80";
}

function normalizeDuration(value: number | null | undefined): 5 | 10 {
  if (value === 10) return 10;
  return 5;
}

export async function launchPremiumRunwaySceneJob(mediaJobId: string) {
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

  const duration = normalizeDuration(mediaJob.duration_seconds);

  const runway = await createRunwaySceneJob({
    promptText:
      mediaJob.prompt_enhanced ||
      mediaJob.prompt ||
      mediaJob.title ||
      "Premium ShopReel scene",
    promptImage: getPromptImageFromScene({
      title: mediaJob.title ?? "Scene",
      prompt: mediaJob.prompt ?? "",
    }),
    duration,
    model: "gen4_turbo",
    ratio: "720:1280",
  });

  const resultPayload =
    mediaJob.result_payload &&
    typeof mediaJob.result_payload === "object" &&
    !Array.isArray(mediaJob.result_payload)
      ? { ...(mediaJob.result_payload as Record<string, Json | undefined>) }
      : {};

  resultPayload.provider_task_id = runway.providerTaskId;
  resultPayload.provider_status = runway.status;
  resultPayload.pipeline = "premium_runway_scene";
  resultPayload.requested_duration_seconds = duration;

  const { error: updateError } = await supabase
    .from("shopreel_media_generation_jobs")
    .update({
      provider: "runway",
      status: "processing",
      provider_job_id: runway.providerTaskId,
      started_at: new Date().toISOString(),
      result_payload: resultPayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", mediaJob.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    mediaJobId: mediaJob.id,
    providerTaskId: runway.providerTaskId,
  };
}
