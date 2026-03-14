import { createAdminClient } from "@/lib/supabase/server";

export async function runPublishWorker() {
  const supabase = createAdminClient();

  const { data: ready } = await supabase
    .from("content_pieces")
    .select("id, tenant_shop_id")
    .eq("status", "ready")
    .limit(10);

  if (!ready || ready.length === 0) {
    return { published: 0 };
  }

  let published = 0;

  for (const item of ready) {
    try {
      await supabase
        .from("content_publications")
        .insert({
          tenant_shop_id: item.tenant_shop_id,
          source_shop_id: item.tenant_shop_id,
          content_piece_id: item.id,
          platform: "instagram",
          status: "published",
          published_at: new Date().toISOString(),
        } as never);

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
    } catch {
      await supabase
        .from("content_calendar_items")
        .update({
          status: "failed_publish",
        })
        .eq("content_piece_id", item.id);
    }
  }

  return { published };
}
