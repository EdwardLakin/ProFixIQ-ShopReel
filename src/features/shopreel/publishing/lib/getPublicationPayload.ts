import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

type ContentPublicationRow = {
  id: string;
  shop_id: string;
  content_event_id: string;
  content_piece_id: string | null;
  content_asset_id: string | null;
  platform_account_id: string | null;
  platform:
    | "instagram"
    | "facebook"
    | "youtube"
    | "tiktok"
    | "blog"
    | "linkedin"
    | "google_business"
    | "email";
  status: "draft" | "queued" | "publishing" | "published" | "failed" | "skipped";
  metadata: Json;
};

type ContentPieceRow = {
  id: string;
  title: string | null;
  body_text: string | null;
  metadata: Json | null;
};

type ContentAssetRow = {
  id: string;
  public_url: string | null;
};

type GenerationRow = {
  id: string;
  generation_metadata: Json | null;
  story_draft: Json | null;
  created_at: string;
};

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export async function getPublicationPayload(publicationId: string) {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: publicationData, error: publicationError } = await legacy
    .from("content_publications")
    .select(
      "id, shop_id, content_event_id, content_piece_id, content_asset_id, platform_account_id, platform, status, metadata",
    )
    .eq("id", publicationId)
    .single();

  const publication = publicationData as ContentPublicationRow | null;

  if (publicationError || !publication) {
    throw new Error(publicationError?.message ?? "Publication not found");
  }

  let piece: ContentPieceRow | null = null;
  if (publication.content_piece_id) {
    const { data: pieceData, error: pieceError } = await legacy
      .from("content_pieces")
      .select("id, title, body_text, metadata")
      .eq("id", publication.content_piece_id)
      .maybeSingle();

    if (pieceError) {
      throw new Error(pieceError.message);
    }

    piece = (pieceData as ContentPieceRow | null) ?? null;
  }

  let asset: ContentAssetRow | null = null;
  if (publication.content_asset_id) {
    const { data: assetData, error: assetError } = await legacy
      .from("content_assets")
      .select("id, public_url")
      .eq("id", publication.content_asset_id)
      .maybeSingle();

    if (assetError) {
      throw new Error(assetError.message);
    }

    asset = (assetData as ContentAssetRow | null) ?? null;
  }

  let generation: GenerationRow | null = null;

  if (publication.content_piece_id) {
    const { data: generationData, error: generationError } = await legacy
      .from("shopreel_story_generations")
      .select("id, generation_metadata, story_draft, created_at")
      .eq("shop_id", publication.shop_id)
      .eq("content_piece_id", publication.content_piece_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (generationError) {
      throw new Error(generationError.message);
    }

    generation = (generationData as GenerationRow | null) ?? null;
  }

  const generationMetadata = objectRecord(generation?.generation_metadata ?? null);
  const draft = objectRecord(generation?.story_draft ?? null);
  const pieceMetadata = objectRecord(piece?.metadata ?? null);

  const resolvedTitle =
    piece?.title ??
    (typeof draft.title === "string" ? draft.title : null) ??
    publication.platform.replaceAll("_", " ");

  const resolvedCaption =
    piece?.body_text ??
    (typeof draft.caption === "string" ? draft.caption : null) ??
    null;

  const resolvedRenderUrl =
    asset?.public_url ??
    (typeof generationMetadata.render_url === "string"
      ? generationMetadata.render_url
      : typeof pieceMetadata.render_url === "string"
        ? pieceMetadata.render_url
        : null);

  const resolvedThumbnailUrl =
    typeof generationMetadata.thumbnail_url === "string"
      ? generationMetadata.thumbnail_url
      : typeof pieceMetadata.thumbnail_url === "string"
        ? pieceMetadata.thumbnail_url
        : null;

  return {
    publication,
    video: {
      id: generation?.id ?? publication.id,
      title: resolvedTitle,
      caption: resolvedCaption,
      render_url: resolvedRenderUrl,
      thumbnail_url: resolvedThumbnailUrl,
    },
  };
}
