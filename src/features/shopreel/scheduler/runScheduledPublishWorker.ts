import { createAdminClient } from "@/lib/supabase/server";

type CalendarItemRow = {
  id: string;
  content_piece_id: string;
};

export async function runScheduledPublishWorker(contentPieceId?: string | null) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  let query = supabase
    .from("content_calendar_items")
    .select("id, content_piece_id")
    .eq("status", "planned")
    .limit(25);

  if (contentPieceId) {
    query = query.eq("content_piece_id", contentPieceId);
  } else {
    query = query.lte("scheduled_for", now);
  }

  const { data: queue, error: queueError } = await query;

  if (queueError) {
    throw new Error(queueError.message);
  }

  const items = (queue ?? []) as CalendarItemRow[];

  if (items.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const item of items) {
    const { error: pieceError } = await supabase
      .from("content_pieces")
      .update({
        status: "queued",
      })
      .eq("id", item.content_piece_id);

    if (pieceError) {
      continue;
    }

    const { error: calendarError } = await supabase
      .from("content_calendar_items")
      .update({
        status: "queued",
      })
      .eq("id", item.id);

    if (calendarError) {
      continue;
    }

    processed += 1;
  }

  return { processed };
}
