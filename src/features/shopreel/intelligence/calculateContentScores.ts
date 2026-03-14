import { createAdminClient } from "@/lib/supabase/server";

export async function calculateContentScores(shopId: string) {
  const supabase = createAdminClient();

  const { data: events } = await supabase
    .from("content_analytics_events")
    .select("*")
    .eq("tenant_shop_id", shopId);

  if (!events) return [];

  const scores: Record<string, number> = {};

  for (const e of events) {
    const id = e.content_piece_id ?? "unknown";

    scores[id] = (scores[id] ?? 0) + (e.event_value ?? 0);
  }

  return Object.entries(scores)
    .map(([contentId, score]) => ({
      contentId,
      score,
    }))
    .sort((a, b) => b.score - a.score);
}
