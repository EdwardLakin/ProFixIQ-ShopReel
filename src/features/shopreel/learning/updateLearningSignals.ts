import { createClient } from "@/lib/supabase/server";

export async function updateLearningSignals(shopId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("v_top_content_types_by_shop")
    .select("*")
    .eq("shop_id", shopId);

  return data;
}