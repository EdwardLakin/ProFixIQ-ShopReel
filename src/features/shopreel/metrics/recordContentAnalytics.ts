import { createAdminClient } from "@/lib/supabase/server"

type Platform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "blog"
  | "linkedin"
  | "google_business"
  | "email"

export async function recordContentAnalytics(input: {
  shopId: string
  contentPieceId: string
  publicationId?: string | null
  platform: Platform
  views?: number
  likes?: number
  shares?: number
  comments?: number
  saves?: number
  clicks?: number
  leads?: number
  bookings?: number
}) {
  const supabase = createAdminClient()

  const events = [
    { name: "views", value: input.views },
    { name: "likes", value: input.likes },
    { name: "shares", value: input.shares },
    { name: "comments", value: input.comments },
    { name: "saves", value: input.saves },
    { name: "clicks", value: input.clicks },
    { name: "leads", value: input.leads },
    { name: "bookings", value: input.bookings },
  ].filter((event) => typeof event.value === "number")

  if (events.length === 0) return []

  const rows = events.map((event) => ({
    tenant_shop_id: input.shopId,
    source_shop_id: input.shopId,
    source_system: "shopreel",
    content_piece_id: input.contentPieceId,
    publication_id: input.publicationId ?? null,
    platform: input.platform,
    event_name: event.name,
    event_value: event.value as number,
    occurred_at: new Date().toISOString(),
    payload: {
      source: "recordContentAnalytics",
    },
  }))

  const { data, error } = await supabase
    .from("content_analytics_events")
    .insert(rows as never)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}
