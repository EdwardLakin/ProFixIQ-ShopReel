import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Database, Json } from "@/types/supabase";

type ShopReelSettingsRow =
  Database["public"]["Tables"]["shop_reel_settings"]["Row"];

type ContentAssetInsert =
  Database["public"]["Tables"]["content_assets"]["Insert"];

type MediaJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

export async function getBrandVoiceContext(): Promise<{
  brandVoice: string | null;
  defaultCta: string | null;
  defaultLocation: string | null;
}> {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shop_reel_settings")
    .select("*")
    .eq("shop_id", shopId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as ShopReelSettingsRow | null;

  return {
    brandVoice: row?.brand_voice ?? null,
    defaultCta: row?.default_cta ?? null,
    defaultLocation: row?.default_location ?? null,
  };
}

export async function enhancePromptWithBrandVoice(args: {
  prompt: string;
  negativePrompt: string;
  style: string;
  visualMode: string;
  aspectRatio: string;
  durationSeconds: number | null;
  jobType: string;
}): Promise<{
  enhancedPrompt: string;
  enhancementNotes: string[];
}> {
  const brand = await getBrandVoiceContext();

  const notes: string[] = [];
  const parts: string[] = [];

  parts.push(args.prompt.trim());

  if (brand.brandVoice?.trim()) {
    parts.push(`Brand voice: ${brand.brandVoice.trim()}.`);
    notes.push("Applied workspace brand voice.");
  }

  if (brand.defaultCta?.trim()) {
    parts.push(`CTA direction: ${brand.defaultCta.trim()}.`);
    notes.push("Included default CTA guidance.");
  }

  if (brand.defaultLocation?.trim()) {
    parts.push(`Location context: ${brand.defaultLocation.trim()}.`);
    notes.push("Included default location context.");
  }

  parts.push(`Style: ${args.style}.`);
  parts.push(`Visual mode: ${args.visualMode}.`);
  parts.push(`Aspect ratio: ${args.aspectRatio}.`);

  if (args.jobType !== "image" && args.durationSeconds) {
    parts.push(`Target duration: ${args.durationSeconds} seconds.`);
  }

  if (args.negativePrompt.trim()) {
    parts.push(`Avoid: ${args.negativePrompt.trim()}.`);
    notes.push("Applied negative prompt guidance.");
  }

  if (!brand.brandVoice && !brand.defaultCta && !brand.defaultLocation) {
    notes.push("No workspace brand voice configured yet.");
  }

  return {
    enhancedPrompt: parts.join(" "),
    enhancementNotes: notes,
  };
}

export async function createThumbnailAssetForMediaJob(
  job: MediaJobRow
): Promise<string | null> {
  if (!job.output_asset_id) return null;

  const supabase = createAdminClient();

  const { data: asset, error: assetError } = await supabase
    .from("content_assets")
    .select("*")
    .eq("id", job.output_asset_id)
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message ?? "Output asset not found");
  }

  const existingThumbId =
    asset.metadata &&
    typeof asset.metadata === "object" &&
    !Array.isArray(asset.metadata) &&
    typeof (asset.metadata as Record<string, unknown>).generated_thumbnail_asset_id === "string"
      ? ((asset.metadata as Record<string, unknown>).generated_thumbnail_asset_id as string)
      : null;

  if (existingThumbId) {
    return existingThumbId;
  }

  const insertPayload: ContentAssetInsert = {
    tenant_shop_id: asset.tenant_shop_id,
    source_shop_id: asset.source_shop_id,
    source_system: "shopreel",
    asset_type: "thumbnail",
    title: asset.title ? `${asset.title} Thumbnail` : "Generated Thumbnail",
    metadata: {
      generated_from_asset_id: asset.id,
      media_generation_job_id: job.id,
      kind: "still_frame_placeholder",
    } satisfies Json,
    public_url: null,
    storage_path: null,
    bucket: null,
    mime_type: null,
    caption: null,
  };

  const { data: thumb, error: thumbError } = await supabase
    .from("content_assets")
    .insert(insertPayload)
    .select("id")
    .single();

  if (thumbError || !thumb?.id) {
    throw new Error(thumbError?.message ?? "Failed to create thumbnail asset");
  }

  const currentMetadata =
    asset.metadata && typeof asset.metadata === "object" && !Array.isArray(asset.metadata)
      ? (asset.metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await supabase
    .from("content_assets")
    .update({
      metadata: {
        ...currentMetadata,
        generated_thumbnail_asset_id: thumb.id,
      } satisfies Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", asset.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return thumb.id;
}
