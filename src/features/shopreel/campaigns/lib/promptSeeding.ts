import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function getCampaignSeedDefaults() {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: recentLearnings, error } = await supabase
    .from("shopreel_campaign_learnings")
    .select("*")
    .eq("shop_id", shopId)
    .eq("learning_type", "winning_angle")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  const winningAngles = (recentLearnings ?? []).map((row) => row.learning_key);

  return {
    winningAngles,
    suggestedHook:
      winningAngles.length > 0
        ? `Recent winning angles: ${winningAngles.join(", ")}`
        : null,
  };
}
