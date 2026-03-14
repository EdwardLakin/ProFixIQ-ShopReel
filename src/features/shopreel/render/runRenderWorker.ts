import { createAdminClient } from "@/lib/supabase/server";

export async function runRenderWorker() {
  const supabase = createAdminClient();

  const { data: queue } = await supabase
    .from("content_pieces")
    .select("id")
    .eq("status", "queued")
    .limit(10);

  if (!queue || queue.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const item of queue) {
    try {
      await supabase
        .from("content_pieces")
        .update({
          status: "processing",
        })
        .eq("id", item.id);

      await supabase
        .from("content_calendar_items")
        .update({
          status: "rendering",
        })
        .eq("content_piece_id", item.id);

      const renderUrl = `/renders/${item.id}.mp4`;

      await supabase
        .from("content_pieces")
        .update({
          status: "ready",
          render_url: renderUrl,
        })
        .eq("id", item.id);

      await supabase
        .from("content_calendar_items")
        .update({
          status: "ready",
        })
        .eq("content_piece_id", item.id);

      processed += 1;
    } catch {
      await supabase
        .from("content_pieces")
        .update({
          status: "failed",
        })
        .eq("id", item.id);

      await supabase
        .from("content_calendar_items")
        .update({
          status: "failed",
        })
        .eq("content_piece_id", item.id);
    }
  }

  return { processed };
}
