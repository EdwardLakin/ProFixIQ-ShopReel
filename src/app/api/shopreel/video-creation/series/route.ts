import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { planManualSeriesScenes } from "@/features/shopreel/video-creation/lib/series";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type Body = {
  title?: string;
  prompt?: string;
  negativePrompt?: string;
  provider?: "openai" | "runway" | "pika" | "luma";
  style?: string;
  visualMode?: string;
  aspectRatio?: string;
  durationSeconds?: number | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();

    const title = body.title?.trim();
    const prompt = body.prompt?.trim();

    if (!title) {
      throw new Error("Title is required");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const scenes = planManualSeriesScenes({
      title,
      prompt,
      negativePrompt: body.negativePrompt?.trim() ?? "",
      style: (body.style as any) ?? "cinematic",
      visualMode: (body.visualMode as any) ?? "photoreal",
      aspectRatio: (body.aspectRatio as any) ?? "9:16",
      durationSeconds: Number(body.durationSeconds ?? 8),
    });

    const createdJobs = [];

    for (const scene of scenes) {
      const { data: job, error } = await supabase
        .from("shopreel_media_generation_jobs")
        .insert({
          shop_id: shopId,
          created_by: null,
          provider: body.provider ?? "openai",
          job_type: "video",
          status: "queued",
          title: scene.title,
          prompt: scene.prompt,
          prompt_enhanced: scene.prompt,
          negative_prompt: body.negativePrompt?.trim() ?? "",
          style: (body.style as any) ?? "cinematic",
          visual_mode: (body.visualMode as any) ?? "photoreal",
          aspect_ratio: (body.aspectRatio as any) ?? "9:16",
          duration_seconds: scene.durationSeconds,
          input_asset_ids: [],
          settings: {
            pipeline: "manual_series",
            series_title: title,
            series_scene_order: scene.sceneOrder,
            series_total_scenes: 4,
            continuity_mode: "locked",
          },
        })
        .select("*")
        .single();

      if (error || !job) {
        throw new Error(error?.message ?? "Failed to create series job");
      }

      createdJobs.push(job);
    }

    return NextResponse.json({
      ok: true,
      count: createdJobs.length,
      jobs: createdJobs.map((job) => ({
        id: job.id,
        title: job.title,
        status: job.status,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create series",
      },
      { status: 500 }
    );
  }
}
