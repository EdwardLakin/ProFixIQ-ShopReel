import { createAdminClient } from "@/lib/supabase/server";
import { scoreStorySource } from "./scoreStorySource";

export async function createOpportunities() {
  const supabase = createAdminClient();

  const { data: sources } = await supabase
    .from("story_sources")
    .select("*")
    .limit(50);

  if (!sources?.length) {
    return { created: 0 };
  }

  let created = 0;

  for (const source of sources) {
    const score = scoreStorySource(source);

    const { error } = await supabase.from("content_opportunities").upsert(
      {
        source_id: source.id,
        score,
        status: "ready",
      },
      { onConflict: "source_id" }
    );

    if (!error) created++;
  }

  return {
    created,
  };
}
