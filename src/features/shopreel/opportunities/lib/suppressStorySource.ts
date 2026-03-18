import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type DB = Database;

export async function suppressStorySource(
  supabase: SupabaseClient<DB>,
  shopId: string,
  sourceKey: string
) {
  const { error } = await supabase
    .from("shopreel_story_sources")
    .update({ suppressed: true } as any)
    .eq("shop_id", shopId)
    .eq("source_key", sourceKey);

  if (error) {
    throw new Error(`Failed to suppress story source: ${error.message}`);
  }
}
