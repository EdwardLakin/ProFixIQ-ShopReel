import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { scoreStorySource } from "./scoreStorySource";

type StorySourceRow = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  tags: string[] | null;
  notes: string[] | null;
};

export async function createOpportunities() {
  const supabase = createAdminClient();
  const legacy = supabase as any;
  const shopId = await getCurrentShopId();

  const { data: sources, error } = await legacy
    .from("shopreel_story_sources")
    .select("id, title, description, kind, tags, notes")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  if (!sources?.length) {
    return { created: 0 };
  }

  let created = 0;

  for (const source of sources as StorySourceRow[]) {
    const score = scoreStorySource(source);

    const reason =
      score >= 85
        ? "High-priority story candidate"
        : score >= 65
          ? "Strong story candidate"
          : score >= 45
            ? "Moderate story candidate"
            : "Low-priority story candidate";

    const { error: upsertError } = await legacy
      .from("shopreel_content_opportunities")
      .upsert(
        {
          shop_id: shopId,
          story_source_id: source.id,
          score,
          status: "ready",
          reason,
          metadata: {
            source_kind: source.kind,
            source_title: source.title,
          },
        },
        {
          onConflict: "shop_id,story_source_id",
        },
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    created++;
  }

  return { created };
}
