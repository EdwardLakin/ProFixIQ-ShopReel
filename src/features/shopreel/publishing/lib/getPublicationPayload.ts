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
};

type ContentAssetRow = {
  id: string;
  public_url: string | null;
};

type VideoRow = {
  id: string;
  title: string;
  caption: string | null;
  render_url: string | null;
  thumbnail_url: string | null;
};

function readVideoIdFromMetadata(metadata: Json): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, Json>).video_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function getPublicationPayload(publicationId: string) {
  const supabase = createAdminClient();

  const { data: publicationData, error: publicationError } = await supabase
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
    const { data: pieceData, error: pieceError } = await supabase
      .from("content_pieces")
      .select("id, title, body_text")
      .eq("id", publication.content_piece_id)
      .maybeSingle();

    if (pieceError) {
      throw new Error(pieceError.message);
    }

    piece = pieceData as ContentPieceRow | null;
  }

  let asset: ContentAssetRow | null = null;
  if (publication.content_asset_id) {
    const { data: assetData, error: assetError } = await supabase
      .from("content_assets")
      .select("id, public_url")
      .eq("id", publication.content_asset_id)
      .maybeSingle();

    if (assetError) {
      throw new Error(assetError.message);
    }

    asset = assetData as ContentAssetRow | null;
  }

  const legacyVideoId = readVideoIdFromMetadata(publication.metadata);

  let video: VideoRow | null = null;
  if (legacyVideoId) {
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .select("id, title, caption, render_url, thumbnail_url")
      .eq("id", legacyVideoId)
      .maybeSingle();

    if (videoError) {
      throw new Error(videoError.message);
    }

    video = videoData as VideoRow | null;
  }

  const resolvedTitle =
    piece?.title ??
    publication.platform.replaceAll("_", " ");

  const resolvedCaption =
    piece?.body_text ?? null;

  const resolvedRenderUrl =
    asset?.public_url ?? video?.render_url ?? null;

  const resolvedThumbnailUrl =
    video?.thumbnail_url ?? null;

  return {
    publication,
    video: {
      id: video?.id ?? publication.id,
      title: resolvedTitle,
      caption: resolvedCaption,
      render_url: resolvedRenderUrl,
      thumbnail_url: resolvedThumbnailUrl,
    },
  };
}