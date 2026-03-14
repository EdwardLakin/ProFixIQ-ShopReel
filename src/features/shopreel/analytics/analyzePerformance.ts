import { createAdminClient } from "@/lib/supabase/server";

export async function analyzePerformance(shopId: string) {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("content_analytics_events")
    .select("*")
    .eq("tenant_shop_id", shopId);

  if (!data) {
    return null;
  }

  const scores: Record<string, number> = {};

  for (const row of data) {
    const key = row.content_piece_id ?? "unknown";

    scores[key] = (scores[key] ?? 0) + (row.event_value ?? 0);
  }

  const ranking = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return ranking;
}
