export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import ReviewWorkspaceClient from "@/features/shopreel/review/components/ReviewWorkspaceClient";
import { mapGenerationToReviewDraft } from "@/features/shopreel/review/reviewDraft";

type JsonObject = Record<string, unknown>;

export default async function ShopReelReviewRoute(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const authSupabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    notFound();
  }

  let shopId: string | null = null;
  try {
    shopId = await getCurrentShopId();
  } catch {
    shopId = null;
  }

  const supabase = createAdminClient();

  const { data: generation, error } = await supabase
    .from("shopreel_story_generations")
    .select("id, shop_id, story_source_id, content_piece_id, status, story_draft, generation_metadata, created_by, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!generation) notFound();

  const isOwner = generation.created_by === user.id;
  const isSameShop = Boolean(shopId && generation.shop_id === shopId);

  if (!isOwner && !isSameShop) {
    notFound();
  }

  const [{ data: storySource }, { data: contentPiece }] = await Promise.all([
    generation.story_source_id
      ? supabase
          .from("shopreel_story_sources")
          .select("id, shop_id, description, metadata")
          .eq("id", generation.story_source_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    generation.content_piece_id
      ? supabase
          .from("content_pieces")
          .select("id, tenant_shop_id, title, hook, script_text, voiceover_text, caption")
          .eq("id", generation.content_piece_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let manualAssetFiles: string[] = [];
  const metadata =
    typeof generation.generation_metadata === "object" && generation.generation_metadata
      ? (generation.generation_metadata as JsonObject)
      : null;
  const manualAssetIds =
    Array.isArray(metadata?.manualAssetIds)
      ? metadata.manualAssetIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : typeof metadata?.manualAssetId === "string"
        ? [metadata.manualAssetId]
        : [];

  if (manualAssetIds.length > 0) {
    const readableAssetIds: string[] = [];

    for (const manualAssetId of manualAssetIds) {
      const { data: asset } = await supabase
        .from("shopreel_manual_assets")
        .select("id, shop_id, created_by")
        .eq("id", manualAssetId)
        .maybeSingle();

      const canReadAsset =
        Boolean(asset?.created_by === user.id) ||
        Boolean(shopId && asset?.shop_id === shopId);

      if (asset && canReadAsset) readableAssetIds.push(asset.id);
    }

    if (readableAssetIds.length > 0) {
      const { data: files } = await supabase
        .from("shopreel_manual_asset_files")
        .select("file_name")
        .in("asset_id", readableAssetIds)
        .order("sort_order", { ascending: true });

      manualAssetFiles = (files ?? [])
        .map((row) => row.file_name)
        .filter((name): name is string => typeof name === "string" && name.trim().length > 0);
    }
  }

  const draft = mapGenerationToReviewDraft({
    generation: {
      ...generation,
      generation_metadata: {
        ...(metadata ?? {}),
        manualAssetFiles,
      },
    },
    storySource,
    contentPiece,
  });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Review draft"
      subtitle="Validate platform copy, copy the output, or download a manual posting package."
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
