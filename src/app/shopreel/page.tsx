export const dynamic = "force-dynamic";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import HomeCommandClient from "./HomeCommandClient";

type StoryDraft = { title?: unknown };

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const { data: recentData } = await supabase.from("shopreel_story_generations").select("id,status,created_at,story_draft").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(10);
  const recent = (recentData ?? []).map((row) => ({ id: row.id, status: row.status ?? "unknown", title: typeof (row.story_draft as StoryDraft | null)?.title === "string" ? String((row.story_draft as StoryDraft).title) : "Untitled generation" }));

  return <GlassShell title="ShopReel Command Center" hidePageIntro hideNotificationsBell fullBleed className="space-y-0"><HomeCommandClient recent={recent} /></GlassShell>;
}
