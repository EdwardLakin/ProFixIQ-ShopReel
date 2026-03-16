import { createAdminClient } from "@/lib/supabase/server";

type RenderJobRow = {
  id: string;
  content_piece_id: string | null;
  publication_id: string | null;
  render_payload: Record<string, unknown> | null;
  attempt_count: number | null;
};

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export async function processRenderJobs(contentPieceId?: string | null) {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  let query = legacy
    .from("reel_render_jobs")
    .select("*")
    .eq("status", "queued")
    .lte("run_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(10);

  if (contentPieceId) {
    query = query.eq("content_piece_id", contentPieceId);
  }

  const { data: jobs, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (!jobs?.length) {
    return { processed: 0 };
  }

  for (const job of jobs as RenderJobRow[]) {
    try {
      await legacy
        .from("reel_render_jobs")
        .update({
          status: "processing",
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
          status: "completed",
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

        await legacy
          .from("content_calendar_items")
          .update({
            status: "ready",
            updated_at: new Date().toISOString(),
          })
          .eq("content_piece_id", job.content_piece_id);
      }

      await legacy
        .from("shopreel_story_generations")
        .update({
          status: "ready",
          updated_at: new Date().toISOString(),
          generation_metadata: {
            ...safeObject(job.render_payload),
            render_completed_at: new Date().toISOString(),
            render_url: fakeRenderUrl,
            thumbnail_url: fakeThumbUrl,
            render_worker: "worker:render",
          },
        })
        .eq("render_job_id", job.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await legacy
        .from("reel_render_jobs")
        .update({
          status: "failed",
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      await legacy
        .from("shopreel_story_generations")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          generation_metadata: {
            ...safeObject(job.render_payload),
            render_failed_at: new Date().toISOString(),
            render_error: message,
            render_worker: "worker:render",
          },
        })
        .eq("render_job_id", job.id);

      if (job.content_piece_id) {
        await legacy
          .from("content_calendar_items")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("content_piece_id", job.content_piece_id);
      }
    }
  }

  return { processed: jobs.length };
}
