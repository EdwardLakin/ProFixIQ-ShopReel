import { platformRegistry } from "@/features/shopreel/platforms/platformRegistry";
import { createAdminClient } from "@/lib/supabase/server";

export async function runPublishWorker() {
  const supabase = createAdminClient();

  const { data: ready } = await supabase
    .from("content_pieces")
    .select("*")
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
        } as any);

      await supabase
        .from("content_pieces")
        .update({
          status: "published",
        })
        .eq("id", item.id);

      published++;
    } catch {
      // ignore for now
    }
  }

  return { published };
}
