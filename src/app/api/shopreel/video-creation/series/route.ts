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
  inputAssetIds?: string[];
  allowAiConcepts?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();

    const title = body.title?.trim();
    const prompt = body.prompt?.trim();
    const inputAssetIds = Array.isArray(body.inputAssetIds)
      ? body.inputAssetIds.filter((id) => typeof id === "string" && id.length > 0)
      : [];

    if (!title) throw new Error("Title is required");
    if (!prompt) throw new Error("Prompt is required");

    const allowAiConcepts = body.allowAiConcepts === true;
    if (inputAssetIds.length === 0 && !allowAiConcepts) {
      throw new Error("Build Series now requires uploaded assets.");
    }

    const durationSeconds = Number(body.durationSeconds ?? 8);
    const seriesKey = `series_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sourceMode = inputAssetIds.length > 0 ? "assets" : "ai";

    const scenes = planManualSeriesScenes({
      title,
      prompt,
      negativePrompt: body.negativePrompt?.trim() ?? "",
      style: body.style ?? "cinematic",
      visualMode: body.visualMode ?? "photoreal",
      aspectRatio: body.aspectRatio ?? "9:16",
      durationSeconds,
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
          style: body.style ?? "cinematic",
          visual_mode: body.visualMode ?? "photoreal",
          aspect_ratio: body.aspectRatio ?? "9:16",
          duration_seconds: scene.durationSeconds,
          input_asset_ids: inputAssetIds,
          settings: {
            pipeline: "manual_series",
            series_key: seriesKey,
            series_title: title,
            series_scene_label: scene.sceneLabel,
            series_scene_order: scene.sceneOrder,
            series_total_scenes: 4,
            series_source_mode: sourceMode,
            continuity_mode: "locked",
            allow_ai_concepts: allowAiConcepts,
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
      seriesKey,
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
