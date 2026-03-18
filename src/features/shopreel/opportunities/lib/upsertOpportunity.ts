import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type DB = Database;

export async function upsertOpportunity(
  supabase: SupabaseClient<DB>,
  shopId: string,
  storySourceId: string,
  score: number,
  metadata: any
) {

  const { error } = await supabase
    .from("shopreel_content_opportunities")
    .upsert(
      {
        shop_id: shopId,
        story_source_id: storySourceId,
        score,
        metadata,
        status: "pending"
      },
      {
        onConflict: "shop_id,story_source_id"
      }
    );

  if (error) {
    throw new Error(`Opportunity upsert failed: ${error.message}`);
  }
}
