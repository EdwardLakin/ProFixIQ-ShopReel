import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type Params = {
  params: Promise<{ id: string }>;
};

type UpdateRenderJobBody = {
  status?: "queued" | "rendering" | "ready" | "published" | "failed";
  outputUrl?: string | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
};

async function safeReadJson(req: NextRequest): Promise<UpdateRenderJobBody> {
  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as UpdateRenderJobBody;
  } catch {
    return {};
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await safeReadJson(req);
  const supabase = createAdminClient();

  const updates = {
    status: body.status ?? "queued",
    output_url: body.outputUrl ?? null,
    thumbnail_url: body.thumbnailUrl ?? null,
    error_message: body.errorMessage ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("reel_render_jobs")
    .update(updates as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    job: data,
  });
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("reel_render_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    job: data,
  });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const shopId = await getCurrentShopId();
    const supabase = createAdminClient();
    const legacy = supabase as any;

    await legacy
      .from("shopreel_story_generations")
      .update({
        render_job_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("render_job_id", id)
      .eq("shop_id", shopId);

    const { error } = await legacy
      .from("reel_render_jobs")
      .delete()
      .eq("id", id)
      .eq("shop_id", shopId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to delete render job",
      },
      { status: 500 }
    );
  }
}
