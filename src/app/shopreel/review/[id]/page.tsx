export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { createAdminClient } from "@/lib/supabase/server";
import ReviewWorkspaceClient from "@/features/shopreel/review/components/ReviewWorkspaceClient";
import { mapGenerationToReviewDraft } from "@/features/shopreel/review/reviewDraft";

export default async function ShopReelReviewRoute(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: generation, error } = await legacy
    .from("shopreel_story_generations")
    .select("id, shop_id, story_source_id, content_piece_id, status, story_draft, generation_metadata, created_at, updated_at")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!generation) notFound();

  const [{ data: storySource }, { data: contentPiece }] = await Promise.all([
    generation.story_source_id
      ? legacy
          .from("shopreel_story_sources")
          .select("id, shop_id, description, metadata")
          .eq("id", generation.story_source_id)
          .eq("shop_id", shopId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    generation.content_piece_id
      ? legacy
          .from("content_pieces")
          .select("id, tenant_shop_id, title, hook, script_text, voiceover_text, caption")
          .eq("id", generation.content_piece_id)
          .eq("tenant_shop_id", shopId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const draft = mapGenerationToReviewDraft({ generation, storySource, contentPiece });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Review draft"
      subtitle="Validate concept details, make light edits, and continue to render jobs."
    >
      {!draft.prompt ? (
        <GlassCard>
          <p className="text-sm text-white/70">No prompt was captured for this draft.</p>
        </GlassCard>
      ) : null}
      <ReviewWorkspaceClient draft={draft} />
    </GlassShell>
  );
}
