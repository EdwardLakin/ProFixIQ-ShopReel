import { createAdminClient } from "@/lib/supabase/server";

type ReelShot = {
  order: number;
  type: string;
  direction: string;
  overlayText: string;
  durationSeconds: number;
};

export async function buildReelPlan(videoId: string, shopId: string) {
  const supabase = createAdminClient();

  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("id, title, hook, voiceover_text, caption")
    .eq("id", videoId)
    .single();

  if (videoError || !video) {
    throw new Error(videoError?.message ?? "Video not found");
  }

  const shots: ReelShot[] = [
    {
      order: 1,
      type: "intro",
      direction: "Wide shot of vehicle entering bay",
      overlayText: video.hook ?? "Here’s what happened in the shop today.",
      durationSeconds: 3,
    },
    {
      order: 2,
      type: "inspection",
      direction: "Close-up of technician checking the issue area",
      overlayText: "Inspection and diagnosis",
      durationSeconds: 5,
    },
    {
      order: 3,
      type: "finding",
      direction: "Tight shot of failed or worn component",
      overlayText: "What we found",
      durationSeconds: 4,
    },
    {
      order: 4,
      type: "repair",
      direction: "Hands-on repair or service process clip",
      overlayText: "Repair in progress",
      durationSeconds: 6,
    },
    {
      order: 5,
      type: "result",
      direction: "Completed vehicle / final reveal shot",
      overlayText: "Final result",
      durationSeconds: 4,
    },
  ];

  const overlays = shots.map((shot) => ({
    order: shot.order,
    text: shot.overlayText,
  }));

  const { data: plan, error: planError } = await supabase
    .from("reel_plans")
    .insert(
      {
        video_id: videoId,
        shop_id: shopId,
        title: video.title,
        hook: video.hook,
        voiceover_text: video.voiceover_text,
        shots,
        overlays,
        music_direction: "Confident, modern, clean shop energy",
        estimated_duration_seconds: shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
        status: "draft",
      } as never,
    )
    .select("id")
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Failed to create reel plan");
  }

  return {
    reelPlanId: plan.id,
    shots,
    overlays,
  };
}
