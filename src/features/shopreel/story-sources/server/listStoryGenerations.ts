import { createAdminClient } from "@/lib/supabase/server";

export async function listStoryGenerations(input: {
  shopId: string;
  limit?: number;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shopreel_story_generations")
    .select("*")
    .eq("shop_id", input.shopId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 25);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
