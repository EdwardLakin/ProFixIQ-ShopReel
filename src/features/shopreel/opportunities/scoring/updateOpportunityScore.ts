import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { scoreStorySource } from "./scoreStorySource";

type DB = Database;

export async function updateOpportunityScore(
  supabase: SupabaseClient<DB>,
  shopId: string,
  storySourceId: string
) {

  const score = await scoreStorySource(
    supabase,
    shopId,
    storySourceId
  );

  const { error } = await supabase
    .from("shopreel_content_opportunities")
    .update({ score })
    .eq("shop_id", shopId)
    .eq("story_source_id", storySourceId);

  if (error) {
    throw new Error(error.message);
  }

}
