import { createAdminClient } from "@/lib/supabase/server";

export async function processRenderJobs() {
  const supabase = createAdminClient();

  const { data: jobs, error } = await supabase
    .from("reel_render_jobs")
    .select("*")
    .eq("status", "queued")
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  if (!jobs?.length) {
    return { processed: 0 };
  }

  for (const job of jobs) {
    try {
      await supabase
        .from("reel_render_jobs")
        .update({
          status: "rendering",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      const payload = job.render_payload;

      // fake renderer for now
      const fakeOutputUrl =
        "https://example.com/rendered/" + job.id + ".mp4";

      const fakeThumb =
        "https://example.com/thumbs/" + job.id + ".jpg";

      await supabase
        .from("reel_render_jobs")
        .update({
          status: "ready",
          output_url: fakeOutputUrl,
          thumbnail_url: fakeThumb,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } catch (err) {
      await supabase
        .from("reel_render_jobs")
        .update({
          status: "failed",
          error_message: String(err),
        })
        .eq("id", job.id);
    }
  }

  return { processed: jobs.length };
}
