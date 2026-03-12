import { createAdminClient } from "@/lib/supabase/server";

export async function processRenderJobs() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: jobs, error } = await legacy
    .from("reel_render_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  if (!jobs?.length) {
    return { processed: 0 };
  }

  for (const job of jobs) {
    try {
      await legacy
        .from("reel_render_jobs")
        .update({
          status: "rendering",
          locked_at: new Date().toISOString(),
          locked_by: "worker:render",
          attempt_count: (job.attempt_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      const fakeRenderUrl = `https://example.com/rendered/${job.id}.mp4`;
      const fakeThumbUrl = `https://example.com/thumbs/${job.id}.jpg`;

      await legacy
        .from("reel_render_jobs")
        .update({
          status: "ready",
          render_url: fakeRenderUrl,
          thumbnail_url: fakeThumbUrl,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", job.id);

      if (job.content_piece_id) {
        await legacy
          .from("content_pieces")
          .update({
            status: "ready",
            render_url: fakeRenderUrl,
            thumbnail_url: fakeThumbUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.content_piece_id);
      }

      await legacy
        .from("shopreel_story_generations")
        .update({
          status: "ready",
          updated_at: new Date().toISOString(),
          generation_metadata: {
            render_completed_at: new Date().toISOString(),
            render_url: fakeRenderUrl,
            thumbnail_url: fakeThumbUrl,
            render_worker: "worker:render",
          },
        })
        .eq("render_job_id", job.id);
    } catch (err) {
      await legacy
        .from("reel_render_jobs")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      await legacy
        .from("shopreel_story_generations")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          generation_metadata: {
            render_failed_at: new Date().toISOString(),
            render_error: err instanceof Error ? err.message : String(err),
            render_worker: "worker:render",
          },
        })
        .eq("render_job_id", job.id);
    }
  }

  return { processed: jobs.length };
}
