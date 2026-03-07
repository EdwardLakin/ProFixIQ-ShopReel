import { createAdminClient } from "@/lib/supabase/server";

export async function updateMarketingMemory(shopId: string) {
  const supabase = createAdminClient();

  const { data: topTypes, error } = await supabase
    .from("v_top_content_types_by_shop")
    .select("*")
    .eq("shop_id", shopId);

  if (error) {
    throw new Error(error.message);
  }

  const memoryValue = {
    updatedAt: new Date().toISOString(),
    topContentTypes: topTypes ?? [],
  };

  const { error: upsertError } = await supabase
    .from("shop_marketing_memory")
    .upsert(
      {
        shop_id: shopId,
        memory_key: "top_content_patterns",
        memory_value: memoryValue,
        source_type: "view",
        confidence: 0.9,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "shop_id,memory_key" },
    );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return memoryValue;
}
