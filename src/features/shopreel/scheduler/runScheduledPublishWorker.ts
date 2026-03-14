import { createAdminClient } from "@/lib/supabase/server";

export async function runScheduledPublishWorker() {
  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const { data: queue } = await supabase
    .from("content_calendar_items")
    .select("*")
    .lte("scheduled_for", now)
    .eq("status", "scheduled")
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
          status: "ready",
        })
        .eq("id", item.content_piece_id);

      await supabase
        .from("content_calendar_items")
        .update({
          status: "completed",
        })
        .eq("id", item.id);

      processed++;
    } catch {
      await supabase
        .from("content_calendar_items")
        .update({
          status: "failed",
        })
        .eq("id", item.id);
    }
  }

  return { processed };
}
