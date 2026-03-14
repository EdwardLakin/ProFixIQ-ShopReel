import { createAdminClient } from "@/lib/supabase/server";

export async function getDashboardData(shopId: string) {
  const supabase = createAdminClient();

  const [{ data: content }, { data: calendar }, { data: analytics }] =
    await Promise.all([
      supabase
        .from("content_pieces")
        .select("*")
        .eq("tenant_shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("content_calendar_items")
        .select("*")
        .eq("tenant_shop_id", shopId)
        .order("scheduled_for", { ascending: true })
        .limit(10),

      supabase
        .from("content_analytics_events")
        .select("*")
        .eq("tenant_shop_id", shopId)
        .limit(100),
    ]);

  return {
    recentContent: content ?? [],
    upcoming: calendar ?? [],
    analytics: analytics ?? [],
  };
}
