import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

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
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
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
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    job: data,
  });
}
