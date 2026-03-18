import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = createAdminClient();

    const { data: scenes, error } = await supabase
      .from("shopreel_campaign_item_scenes")
      .select("id, media_job_id")
      .eq("campaign_item_id", id)
      .order("scene_order", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const jobIds = (scenes ?? [])
      .map((scene) => scene.media_job_id)
      .filter((value): value is string => !!value);

    const runResults = [];
    for (const jobId of jobIds) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/shopreel/video-creation/jobs/${jobId}/run`,
        { method: "POST" }
      );
      runResults.push({ jobId, ok: res.ok, status: res.status });
    }

    return NextResponse.json({
      ok: true,
      runResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run scene jobs",
      },
      { status: 500 }
    );
  }
}
