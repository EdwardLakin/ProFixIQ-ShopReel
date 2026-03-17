import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Database, Json } from "@/types/supabase";

type MediaJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

export async function ensureContentPieceForMediaJob(
  job: MediaJobRow
): Promise<string | null> {
  if (!job.output_asset_id) return null;

  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  if (job.source_content_piece_id) {
    return job.source_content_piece_id;
  }

  const metadataMatch: Record<string, unknown> = {
    media_generation_job_id: job.id,
  };

  const { data: existingPiece, error: existingPieceError } = await supabase
    .from("content_pieces")
    .select("id")
    .eq("tenant_shop_id", shopId)
    .contains("metadata", metadataMatch)
    .limit(1)
    .maybeSingle();

  if (existingPieceError) {
    throw new Error(existingPieceError.message);
  }

  if (existingPiece?.id) {
    return existingPiece.id;
  }

  const title = job.title?.trim() || "Generated media";
  const isImage = job.job_type === "image";

  const { data: insertedPiece, error: insertedPieceError } = await supabase
    .from("content_pieces")
    .insert({
      tenant_shop_id: shopId,
      source_shop_id: shopId,
      source_system: "shopreel",
      title,
      status: "draft",
      content_type: isImage ? "generated_visual" : "generated_video",
      hook: null,
      caption: job.prompt ?? null,
      cta: null,
      script_text: null,
      voiceover_text: null,
      platform_targets: [],
      render_url: null,
      published_at: null,
      thumbnail_url: null,
      metadata: {
        media_generation_job_id: job.id,
        output_asset_id: job.output_asset_id,
        provider: job.provider,
        job_type: job.job_type,
        aspect_ratio: job.aspect_ratio,
        style: job.style,
        visual_mode: job.visual_mode,
      } satisfies Json,
    })
    .select("id")
    .single();

  if (insertedPieceError || !insertedPiece?.id) {
    throw new Error(insertedPieceError?.message ?? "Failed to create content piece");
  }

  const { error: linkJobError } = await supabase
    .from("shopreel_media_generation_jobs")
    .update({
      source_content_piece_id: insertedPiece.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (linkJobError) {
    throw new Error(linkJobError.message);
  }

  return insertedPiece.id;
}
