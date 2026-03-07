import { createClient } from "@/lib/supabase/server";

export async function discoverContent(shopId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("work_orders")
    .select(`
      id,
      custom_id,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      complaint,
      work_order_lines (
        id,
        description,
        status,
        job_type
      )
    `)
    .eq("shop_id", shopId)
    .limit(20);

  return data ?? [];
}