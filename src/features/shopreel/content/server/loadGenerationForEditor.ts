import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { StoryDraft } from "@/features/shopreel/story-builder/types";

function asStoryDraft(value: unknown): StoryDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as StoryDraft;
}

export async function loadGenerationForEditor(id: string) {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: generation, error } = await legacy
    .from("shopreel_story_generations")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const draft = asStoryDraft(generation?.story_draft ?? null);

  return {
    generation,
    draft,
  };
}
