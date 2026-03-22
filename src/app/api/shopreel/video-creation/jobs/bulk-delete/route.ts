import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type Body = {
  jobIds?: string[];
};

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    )
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const jobIds = uniqueIds(body.jobIds);

    if (jobIds.length === 0) {
      throw new Error("No job IDs provided.");
    }

    const supabase = createAdminClient();
    const shopId = await getCurrentShopId();

    const { data: jobs, error: jobsError } = await supabase
      .from("shopreel_media_generation_jobs")
      .select("id, output_asset_id, settings")
      .eq("shop_id", shopId)
      .in("id", jobIds);

    if (jobsError) {
      throw new Error(jobsError.message);
    }

    const foundIds = (jobs ?? []).map((job) => job.id);

    if (foundIds.length === 0) {
      return NextResponse.json({ ok: true, deletedCount: 0 });
    }

    const outputAssetIds = (jobs ?? [])
      .map((job) => job.output_asset_id)
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    const sceneIds = (jobs ?? [])
      .map((job) => {
        const settings =
          job.settings && typeof job.settings === "object" && !Array.isArray(job.settings)
            ? (job.settings as Record<string, unknown>)
            : null;

        return typeof settings?.scene_id === "string" ? settings.scene_id : null;
      })
      .filter((value): value is string => !!value);

    if (sceneIds.length > 0) {
      const { error: resetScenesError } = await supabase
        .from("shopreel_campaign_item_scenes")
        .update({
          media_job_id: null,
          output_asset_id: null,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("shop_id", shopId)
        .in("id", sceneIds);

      if (resetScenesError) {
        throw new Error(resetScenesError.message);
      }
    }

    const { error: deleteJobsError } = await supabase
      .from("shopreel_media_generation_jobs")
      .delete()
      .eq("shop_id", shopId)
      .in("id", foundIds);

    if (deleteJobsError) {
      throw new Error(deleteJobsError.message);
    }

    if (outputAssetIds.length > 0) {
      await supabase
        .from("content_assets")
        .delete()
        .eq("tenant_shop_id", shopId)
        .in("id", outputAssetIds);
    }

    return NextResponse.json({
      ok: true,
      deletedCount: foundIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to bulk delete jobs",
      },
      { status: 500 }
    );
  }
}
