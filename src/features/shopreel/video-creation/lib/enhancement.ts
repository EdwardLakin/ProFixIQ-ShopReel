import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Database, Json } from "@/types/supabase";

type MediaJobRow =
  Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

async function getBrandVoiceContext(shopId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("shop_reel_settings")
    .select("brand_voice, default_cta, default_location, enabled_platforms")
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    brandVoice: data?.brand_voice ?? null,
    defaultCta: data?.default_cta ?? null,
    defaultLocation: data?.default_location ?? null,
    enabledPlatforms: data?.enabled_platforms ?? [],
  };
}

export async function enhancePromptWithBrandVoice(args: {
  prompt: string | null;
  style: string | null;
  visualMode: string | null;
  aspectRatio: string;
  durationSeconds: number | null;
}) {
  const shopId = await getCurrentShopId();
  const brand = await getBrandVoiceContext(shopId);

  const parts = [
    args.prompt?.trim() || "",
    brand.brandVoice ? `Brand voice: ${brand.brandVoice}.` : "",
    brand.defaultCta ? `Preferred CTA: ${brand.defaultCta}.` : "",
    brand.defaultLocation ? `Location context: ${brand.defaultLocation}.` : "",
    args.style ? `Style: ${args.style}.` : "",
    args.visualMode ? `Visual mode: ${args.visualMode}.` : "",
    `Aspect ratio: ${args.aspectRatio}.`,
    args.durationSeconds ? `Duration: ${args.durationSeconds} seconds.` : "",
    Array.isArray(brand.enabledPlatforms) && brand.enabledPlatforms.length > 0
      ? `Target platforms: ${brand.enabledPlatforms.join(", ")}.`
      : "",
  ].filter(Boolean);

  return parts.join(" ");
}

export async function createThumbnailAssetForMediaJob(args: {
  mediaJob: MediaJobRow;
}) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  if (!args.mediaJob.output_asset_id) {
    throw new Error("Media job has no output asset to derive thumbnail from.");
  }

  const { data, error } = await supabase
    .from("content_assets")
    .insert({
      tenant_shop_id: shopId,
      source_shop_id: shopId,
      source_system: "shopreel",
      asset_type: "thumbnail",
      title: `${args.mediaJob.title ?? "Generated media"} Thumbnail`,
      metadata: {
        derived_from_media_job_id: args.mediaJob.id,
        derived_from_asset_id: args.mediaJob.output_asset_id,
        note: "Placeholder thumbnail asset created from completed media job.",
      } satisfies Json,
      public_url: null,
      storage_path: null,
      bucket: null,
      mime_type: null,
      caption: null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Failed to create thumbnail asset");
  }

  return data.id;
}
