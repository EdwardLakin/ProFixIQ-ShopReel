import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();

    const { data: job, error: jobError } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (jobError || !job) {
      throw new Error(jobError?.message ?? "Media generation job not found");
    }

    if (!job.output_asset_id) {
      return NextResponse.json(
        { ok: false, error: "Completed media job has no output asset." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: asset, error: assetError } = await supabase
      .from("content_assets")
      .select("*")
      .eq("id", job.output_asset_id)
      .single();

    if (assetError || !asset) {
      throw new Error(assetError?.message ?? "Output asset not found");
    }

    const thumbnailTitle = `${job.title ?? "Generated media"} thumbnail`;

    const { data: thumbnailAsset, error: thumbnailError } = await supabase
      .from("content_assets")
      .insert({
        tenant_shop_id: asset.tenant_shop_id,
        source_shop_id: asset.source_shop_id,
        source_system: "shopreel",
        asset_type: "thumbnail",
        title: thumbnailTitle,
        metadata: {
          source_media_generation_job_id: job.id,
          source_output_asset_id: asset.id,
          generated_thumbnail: true,
          note: "Placeholder thumbnail/still-frame record. Actual image extraction hook not wired yet.",
        } satisfies Json,
        public_url: null,
        storage_path: null,
        bucket: null,
        mime_type: null,
        caption: null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (thumbnailError || !thumbnailAsset?.id) {
      throw new Error(thumbnailError?.message ?? "Failed to create thumbnail asset");
    }

    return NextResponse.json({
      ok: true,
      thumbnailAssetId: thumbnailAsset.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to generate thumbnail",
      },
      { status: 500 }
    );
  }
}
