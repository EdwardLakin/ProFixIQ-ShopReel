import { createAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/supabase";

type MediaJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

function buildStoryDraft(job: MediaJobRow) {
  const title = job.title ?? "Generated story";
  const overlay =
    job.title ??
    "AI-generated marketing clip";
  const voiceover =
    job.prompt_enhanced ??
    job.prompt ??
    "AI-generated ShopReel story.";

  return {
    title,
    sourceKind: "video_creation",
    tone: job.style ?? "cinematic",
    hook: title,
    cta: "Create, publish, and grow with ShopReel.",
    caption: voiceover,
    scriptText: voiceover,
    voiceoverText: voiceover,
    scenes: [
      {
        id: `${job.id}-scene-1`,
        title,
        role: "hook",
        durationSeconds: job.duration_seconds ?? 8,
        overlayText: overlay,
        voiceoverText: voiceover,
        media: job.output_asset_id
          ? [
              {
                id: job.output_asset_id,
                type: "video",
                assetId: job.output_asset_id,
                url: job.preview_url,
              },
            ]
          : [],
      },
    ],
  };
}

export async function convertMediaJobToStoryGeneration(mediaJobId: string) {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: mediaJob, error: mediaJobError } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("id", mediaJobId)
    .single();

  if (mediaJobError || !mediaJob) {
    throw new Error(mediaJobError?.message ?? "Media job not found");
  }

  if (mediaJob.source_generation_id) {
    return {
      generationId: mediaJob.source_generation_id,
      alreadyExisted: true,
    };
  }

  if (!mediaJob.output_asset_id) {
    throw new Error("Media job has no generated output asset yet.");
  }

  const storySourceId = `video-create-${mediaJob.id}`;

  const { error: storySourceError } = await supabase
    .from("shopreel_story_sources")
    .upsert(
      {
        id: storySourceId,
        shop_id: mediaJob.shop_id,
        kind: "video_creation",
        origin: "shopreel_video_creation",
        generation_mode: "manual",
        title: mediaJob.title ?? "Generated video story",
        description: mediaJob.prompt ?? mediaJob.prompt_enhanced ?? null,
        metadata: {
          media_job_id: mediaJob.id,
          output_asset_id: mediaJob.output_asset_id,
          source_content_piece_id: mediaJob.source_content_piece_id,
        } satisfies Json,
      },
      { onConflict: "id" }
    );

  if (storySourceError) {
    throw new Error(storySourceError.message);
  }

  const storyDraft = buildStoryDraft(mediaJob);

  const { data: generation, error: generationError } = await legacy
    .from("shopreel_story_generations")
    .insert({
      shop_id: mediaJob.shop_id,
      story_source_id: storySourceId,
      status: "ready",
      content_piece_id: mediaJob.source_content_piece_id,
      generation_metadata: {
        output_type: "video",
        created_from: "video_creation_job",
        media_job_id: mediaJob.id,
        preview_url: mediaJob.preview_url,
        output_asset_id: mediaJob.output_asset_id,
      },
      story_draft: storyDraft,
      render_job_id: null,
      reel_plan_id: null,
      created_by: mediaJob.created_by,
    })
    .select("id")
    .single();

  if (generationError || !generation?.id) {
    throw new Error(generationError?.message ?? "Failed to create story generation");
  }

  const { error: updateMediaJobError } = await supabase
    .from("shopreel_media_generation_jobs")
    .update({
      source_generation_id: generation.id,
      updated_at: new Date().toISOString(),
      result_payload: {
        ...(typeof mediaJob.result_payload === "object" && mediaJob.result_payload
          ? mediaJob.result_payload
          : {}),
        source_generation_id: generation.id,
        converted_to_story_generation: true,
      },
    })
    .eq("id", mediaJob.id);

  if (updateMediaJobError) {
    throw new Error(updateMediaJobError.message);
  }

  return {
    generationId: generation.id,
    alreadyExisted: false,
  };
}
