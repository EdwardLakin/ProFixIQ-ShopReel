import { createAdminClient } from "@/lib/supabase/server"

type Platform = "instagram" | "facebook" | "tiktok" | "youtube"

export async function recordContentAnalytics(input: {
  shopId: string
  contentPieceId: string
  platform: Platform
  views?: number
  likes?: number
  shares?: number
  comments?: number
}) {
  const supabase = createAdminClient()

  const events = [
    { name: "views", value: input.views },
    { name: "likes", value: input.likes },
    { name: "shares", value: input.shares },
    { name: "comments", value: input.comments },
  ].filter(e => typeof e.value === "number")

  if (events.length === 0) return

  const rows = events.map(e => ({
    tenant_shop_id: input.shopId,
    source_shop_id: input.shopId,
    content_piece_id: input.contentPieceId,
    platform: input.platform,
    event_name: e.name,
    event_value: e.value as number,
    occurred_at: new Date().toISOString(),
  }))

  await supabase.from("content_analytics_events").insert(rows)
}
