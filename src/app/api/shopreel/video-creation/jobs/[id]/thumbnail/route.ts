import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createThumbnailAssetForMediaJob } from "@/features/shopreel/video-creation/lib/enhancement";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();

    const { data: mediaJob, error } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !mediaJob) {
      throw new Error(error?.message ?? "Media job not found");
    }

    const thumbnailAssetId = await createThumbnailAssetForMediaJob({
      mediaJob,
    });

    return NextResponse.json({
      ok: true,
      thumbnailAssetId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create thumbnail asset",
      },
      { status: 500 }
    );
  }
}
