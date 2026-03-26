import { createAdminClient } from "@/lib/supabase/server";
import { buildStorySourceKey } from "../buildStorySourceKey";
import type { StorySource } from "../types";

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export async function saveStorySource(source: StorySource) {
  if (!source.shopId || typeof source.shopId !== "string" || source.shopId.trim().length === 0) {
    throw new Error(
      `[saveStorySource] Missing shopId for story source title="${source.title}" kind="${source.kind}"`
    );
  }

  const supabase = createAdminClient();
  const sourceKey = buildStorySourceKey(source);

  const { data: existing } = await supabase
    .from("shopreel_story_sources")
    .select("id")
    .eq("shop_id", source.shopId)
    .eq("source_key", sourceKey)
    .maybeSingle();

  if (existing?.id) {
    return { id: existing.id, deduped: true };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("shopreel_story_sources")
    .insert({
      shop_id: source.shopId,
      title: source.title,
      description: source.description ?? null,
      kind: source.kind,
      origin: source.origin,
      generation_mode: source.generationMode,
      occurred_at: source.occurredAt ?? null,
      started_at: source.startedAt ?? null,
      ended_at: source.endedAt ?? null,
      project_id: source.projectId ?? null,
      project_name: source.projectName ?? null,
      vehicle_label: source.vehicleLabel ?? null,
      customer_label: source.customerLabel ?? null,
      technician_label: source.technicianLabel ?? null,
      tags: source.tags,
      notes: source.notes,
      facts: toJson(source.facts),
      metadata: toJson(source.metadata),
      source_key: sourceKey,
    } as never)
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to save story source");
  }

  if (source.assets.length > 0) {
    const { error: assetError } = await supabase
      .from("shopreel_story_source_assets")
      .insert(
        source.assets.map((asset) => ({
          story_source_id: inserted.id,
          shop_id: source.shopId,
          asset_type: asset.assetType,
          content_asset_id: asset.contentAssetId ?? null,
          manual_asset_id: asset.manualAssetId ?? null,
          url: asset.url ?? null,
          title: asset.title ?? null,
          caption: asset.caption ?? null,
          note: asset.note ?? null,
          taken_at: asset.takenAt ?? null,
          sort_order: asset.sortOrder,
          metadata: toJson(asset.metadata),
        })) as never,
      );

    if (assetError) {
      throw new Error(assetError.message);
    }
  }

  if (source.refs.length > 0) {
    const { error: refError } = await supabase
      .from("shopreel_story_source_refs")
      .insert(
        source.refs.map((ref) => ({
          story_source_id: inserted.id,
          shop_id: source.shopId,
          ref_type: ref.type,
          ref_id: ref.id,
          metadata: {},
        })) as never,
      );

    if (refError) {
      throw new Error(refError.message);
    }
  }

  return { id: inserted.id, deduped: false };
}
