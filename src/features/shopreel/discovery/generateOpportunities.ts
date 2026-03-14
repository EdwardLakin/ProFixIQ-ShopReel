import { createAdminClient } from "@/lib/supabase/server";

export async function generateOpportunities(shopId: string) {
  const supabase = createAdminClient();

  const { data: sources } = await supabase
    .from("shopreel_story_sources")
    .select("*")
    .eq("shop_id", shopId)
    .limit(20);

  if (!sources) {
    return { created: 0 };
  }

  let created = 0;

  for (const source of sources) {
    await supabase
      .from("shopreel_content_opportunities")
      .insert({
        shop_id: shopId,
        story_source_id: source.id,
        status: "pending",
      });

    created++;
  }

  return { created };
}
