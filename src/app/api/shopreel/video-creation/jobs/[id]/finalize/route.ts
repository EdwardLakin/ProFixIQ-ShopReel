import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { finalizeVideoWithCta } from "@/features/shopreel/video-creation/lib/finalizeVideo";

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

    if (mediaJob.status !== "completed") {
      throw new Error("Media job must be completed before finalizing.");
    }

    const asset = await finalizeVideoWithCta(mediaJob);

    return NextResponse.json({
      ok: true,
      asset,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to finalize video",
      },
      { status: 500 }
    );
  }
}
