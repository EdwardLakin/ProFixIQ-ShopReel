import { createAdminClient } from "@/lib/supabase/server";

type ContentPieceRow = {
  id: string;
  tenant_shop_id: string;
};

export async function runPublishWorker(contentPieceId?: string | null) {
  const supabase = createAdminClient();

  let query = supabase
    .from("content_pieces")
    .select("id, tenant_shop_id")
    .eq("status", "ready")
    .limit(25);

  if (contentPieceId) {
    query = query.eq("id", contentPieceId);
  }

  const { data: ready, error: readyError } = await query;

  if (readyError) {
    throw new Error(readyError.message);
  }

  const items = (ready ?? []) as ContentPieceRow[];

  if (items.length === 0) {
    return { published: 0 };
  }

  let published = 0;

  for (const item of items) {
    await supabase
      .from("content_calendar_items")
      .update({
        status: "publishing",
      })
      .eq("content_piece_id", item.id);

    const { error: publicationError } = await supabase
      .from("content_publications")
      .insert({
        tenant_shop_id: item.tenant_shop_id,
        source_shop_id: item.tenant_shop_id,
        content_piece_id: item.id,
        platform: "instagram",
        status: "published",
        published_at: new Date().toISOString(),
      } as never);

    if (publicationError) {
      await supabase
        .from("content_calendar_items")
        .update({
          status: "failed_publish",
        })
        .eq("content_piece_id", item.id);
      continue;
    }

    await supabase
      .from("content_pieces")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    await supabase
      .from("content_calendar_items")
      .update({
        status: "published",
      })
      .eq("content_piece_id", item.id);

    published += 1;
  }

  return { published };
}
