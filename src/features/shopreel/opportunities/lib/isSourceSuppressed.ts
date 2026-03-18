import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type DB = Database;

export async function isSourceSuppressed(
  supabase: ReturnType<typeof createClient<DB>>,
  shopId: string,
  sourceKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("shopreel_story_sources")
    .select("suppressed")
    .eq("shop_id", shopId)
    .eq("source_key", sourceKey)
    .single();

  if (error || !data) return false;

  return Boolean((data as any).suppressed);
}
