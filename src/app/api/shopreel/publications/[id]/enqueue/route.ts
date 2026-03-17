import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;
    const now = new Date().toISOString();

    const { data: publication, error: publicationError } = await legacy
      .from("content_publications")
      .select("*")
      .eq("id", id)
      .or(`tenant_shop_id.eq.${shopId},source_shop_id.eq.${shopId}`)
      .maybeSingle();

    if (publicationError) {
      throw new Error(publicationError.message);
    }

    if (!publication) {
      return NextResponse.json(
        { ok: false, error: "Publication not found" },
        { status: 404 }
      );
    }

    const { data: existingJobs, error: existingJobsError } = await legacy
      .from("shopreel_publish_jobs")
      .select("*")
      .eq("publication_id", id)
      .in("status", ["queued", "processing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingJobsError) {
      throw new Error(existingJobsError.message);
    }

    const existingJob = existingJobs?.[0] ?? null;
    if (existingJob) {
      return NextResponse.json({
        ok: true,
        alreadyQueued: true,
        publicationId: id,
        publishJobId: existingJob.id,
      });
    }

    const { error: publicationUpdateError } = await legacy
      .from("content_publications")
      .update({
        status: "queued",
        error_text: null,
        updated_at: now,
      })
      .eq("id", id);

    if (publicationUpdateError) {
      throw new Error(publicationUpdateError.message);
    }

    const { data: publishJob, error: publishJobError } = await legacy
      .from("shopreel_publish_jobs")
      .insert({
        publication_id: id,
        shop_id: shopId,
        status: "queued",
        attempt_count: 0,
        error_message: null,
        run_after: now,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (publishJobError) {
      throw new Error(publishJobError.message);
    }

    return NextResponse.json({
      ok: true,
      alreadyQueued: false,
      publicationId: id,
      publishJobId: publishJob.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to enqueue publication",
      },
      { status: 500 }
    );
  }
}
