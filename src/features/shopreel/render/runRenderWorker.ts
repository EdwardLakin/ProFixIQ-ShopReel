import { createAdminClient } from "@/lib/supabase/server";

type ContentPieceRow = {
  id: string;
};

export async function runRenderWorker(contentPieceId?: string | null) {
  const supabase = createAdminClient();

  let query = supabase
    .from("content_pieces")
    .select("id")
    .eq("status", "queued")
    .limit(25);

  if (contentPieceId) {
    query = query.eq("id", contentPieceId);
  }

  const { data: queue, error: queueError } = await query;

  if (queueError) {
    throw new Error(queueError.message);
  }

  const items = (queue ?? []) as ContentPieceRow[];

  if (items.length === 0) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const item of items) {
    const { error: markRenderingError } = await supabase
      .from("content_pieces")
      .update({
        status: "processing",
      })
      .eq("id", item.id);

    if (markRenderingError) {
      continue;
    }

    await supabase
      .from("content_calendar_items")
      .update({
        status: "rendering",
      })
      .eq("content_piece_id", item.id);

    const renderUrl = `/renders/${item.id}.mp4`;

    const { error: markReadyError } = await supabase
      .from("content_pieces")
      .update({
        status: "ready",
        render_url: renderUrl,
      })
      .eq("id", item.id);

    if (markReadyError) {
      await supabase
        .from("content_calendar_items")
        .update({
          status: "failed",
        })
        .eq("content_piece_id", item.id);
      continue;
    }

    await supabase
      .from("content_calendar_items")
      .update({
        status: "ready",
      })
      .eq("content_piece_id", item.id);

    processed += 1;
  }

  return { processed };
}
