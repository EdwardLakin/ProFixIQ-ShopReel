import { createAdminClient } from "@/lib/supabase/server";

type TopContentTypeRow = {
  shop_id: string | null;
  content_type: string | null;
  avg_engagement_score: number | null;
  total_views: number | null;
  total_posts: number | null;
  last_posted_at: string | null;
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

  const rows = ((data ?? []) as TopContentTypeRow[]).filter(
    (row): row is TopContentTypeRow & { shop_id: string; content_type: string } =>
      typeof row.shop_id === "string" &&
      row.shop_id.length > 0 &&
      typeof row.content_type === "string" &&
      row.content_type.length > 0,
  );

  const upserts = rows.map((row) => ({
    shop_id: row.shop_id,
    content_type: row.content_type,
    avg_engagement_score: row.avg_engagement_score ?? 0,
    total_views: row.total_views ?? 0,
    total_posts: row.total_posts ?? 0,
    last_posted_at: row.last_posted_at ?? null,
    notes: {},
    updated_at: new Date().toISOString(),
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
