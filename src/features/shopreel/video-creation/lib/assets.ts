import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function listSelectableContentAssets(limit = 50) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("content_assets")
    .select("id, title, asset_type, public_url, created_at, metadata")
    .eq("tenant_shop_id", shopId)
    .in("asset_type", ["photo", "video", "thumbnail", "render_output"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
