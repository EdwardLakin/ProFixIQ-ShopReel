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

    const { data: job, error: jobError } = await legacy
      .from("shopreel_publish_jobs")
      .select("*")
      .eq("id", id)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (jobError) {
      throw new Error(jobError.message);
    }

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "Publish job not found" },
        { status: 404 }
      );
    }

    const workerRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/shopreel/worker/publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: id }),
      }
    );

    const workerJson = await workerRes.json().catch(() => ({}));

    if (!workerRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            typeof workerJson?.error === "string"
              ? workerJson.error
              : "Publish worker failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      jobId: id,
      worker: workerJson,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to run publish job",
      },
      { status: 500 }
    );
  }
}
