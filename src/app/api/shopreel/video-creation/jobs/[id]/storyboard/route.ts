import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createStoryboardFromMediaJob } from "@/features/shopreel/video-creation/lib/storyboards";

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

    const storyboardId = await createStoryboardFromMediaJob({
      mediaJob,
    });

    return NextResponse.json({
      ok: true,
      storyboardId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create storyboard",
      },
      { status: 500 }
    );
  }
}
