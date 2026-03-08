import { createAdminClient } from "@/lib/supabase/server";

type TopContentTypeRow = {
  shop_id: string;
  content_type: string;
  avg_engagement_score: number | null;
  total_views: number | null;
  total_leads: number | null;
  posts_generated: number | null;
  last_updated: string | null;
};

export async function updateLearningSignals(shopId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("v_top_content_types_by_shop")
    .select("*")
    .eq("shop_id", shopId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TopContentTypeRow[];

  const upserts = rows.map((row) => ({
    shop_id: row.shop_id,
    content_type: row.content_type,
    avg_engagement_score: row.avg_engagement_score ?? 0,
    total_views: row.total_views ?? 0,
    total_leads: row.total_leads ?? 0,
    posts_generated: row.posts_generated ?? 0,
    last_updated: new Date().toISOString(),
  }));

  if (upserts.length > 0) {
    const { error: upsertError } = await supabase
      .from("shop_content_signals")
      .upsert(upserts as never, { onConflict: "shop_id,content_type" });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    count: upserts.length,
    rows,
  };
}
