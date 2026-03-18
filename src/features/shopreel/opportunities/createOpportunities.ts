import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { scoreStorySource } from "./scoreStorySource";
import type { Json } from "@/types/supabase";

function buildReason(score: number): string {
  if (score >= 90) return "Very strong story potential";
  if (score >= 75) return "High-value marketing opportunity";
  if (score >= 60) return "Promising content opportunity";
  return "Detected story opportunity";
}

export async function createOpportunities() {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: sources, error: sourceError } = await supabase
    .from("shopreel_story_sources")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const createdOrUpdated = [];

  for (const source of sources ?? []) {
    const { data: existing } = await supabase
      .from("shopreel_content_opportunities")
      .select("*")
      .eq("shop_id", shopId)
      .eq("story_source_id", source.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const current = existing?.[0] ?? null;

    if (current?.status === "dismissed" || current?.status === "generated") {
      continue;
    }

    const score = scoreStorySource(source);
    const reason = buildReason(score);

    if (current) {
      const currentMetadata =
        current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
          ? (current.metadata as Record<string, Json | undefined>)
          : {};

      const { data: updated, error: updateError } = await supabase
        .from("shopreel_content_opportunities")
        .update({
          score,
          reason,
          metadata: {
            ...currentMetadata,
            scoring: {
              source_kind: source.kind,
              source_origin: source.origin,
              source_title: source.title,
            },
          },
          status: current.status || "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      createdOrUpdated.push(updated);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("shopreel_content_opportunities")
      .insert({
        shop_id: shopId,
        story_source_id: source.id,
        score,
        reason,
        metadata: {
          scoring: {
            source_kind: source.kind,
            source_origin: source.origin,
            source_title: source.title,
          },
        },
        status: "ready",
      })
      .select("*")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    createdOrUpdated.push(inserted);
  }

  return createdOrUpdated;
}
