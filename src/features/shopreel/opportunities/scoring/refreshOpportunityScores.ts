import { createAdminClient } from "@/lib/supabase/server";
import { updateOpportunityScore } from "./updateOpportunityScore";

type RefreshResult = {
  ok: true;
  shopId: string;
  updated: number;
  skipped: number;
};

export async function refreshOpportunityScores(
  shopId: string
): Promise<RefreshResult> {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: opportunities, error } = await legacy
    .from("shopreel_content_opportunities")
    .select("id, story_source_id, status")
    .eq("shop_id", shopId)
    .not("story_source_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  let updated = 0;
  let skipped = 0;

  for (const opportunity of opportunities ?? []) {
    if (!opportunity.story_source_id) {
      skipped += 1;
      continue;
    }

    await updateOpportunityScore(
      supabase,
      shopId,
      opportunity.story_source_id
    );

    updated += 1;
  }

  return {
    ok: true,
    shopId,
    updated,
    skipped,
  };
}
