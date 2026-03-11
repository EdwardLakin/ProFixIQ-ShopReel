import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = (await req.json().catch(() => ({}))) as {
      status?:
        | "draft"
        | "queued"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled";
      scheduledFor?: string | null;
      publishedAt?: string | null;
      externalPostId?: string | null;
      externalUrl?: string | null;
      errorCode?: string | null;
      errorMessage?: string | null;
      metadata?: Json | null;
      title?: string | null;
      caption?: string | null;
    };

    const updatePayload: {
      status?:
        | "draft"
        | "queued"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled";
      scheduled_for?: string | null;
      published_at?: string | null;
      platform_post_id?: string | null;
      platform_post_url?: string | null;
      error_code?: string | null;
      error_message?: string | null;
      metadata?: Json;
      title?: string | null;
      caption?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      updatePayload.status = body.status;
    }

    if (body.scheduledFor !== undefined) {
      updatePayload.scheduled_for = body.scheduledFor;
    }

    if (body.publishedAt !== undefined) {
      updatePayload.published_at = body.publishedAt;
    }

    if (body.externalPostId !== undefined) {
      updatePayload.platform_post_id = body.externalPostId;
    }

    if (body.externalUrl !== undefined) {
      updatePayload.platform_post_url = body.externalUrl;
    }

    if (body.errorCode !== undefined) {
      updatePayload.error_code = body.errorCode;
    }

    if (body.errorMessage !== undefined) {
      updatePayload.error_message = body.errorMessage;
    }

    if (body.metadata !== undefined) {
      updatePayload.metadata = body.metadata ?? {};
    }

    if (body.title !== undefined) {
      updatePayload.title = body.title;
    }

    if (body.caption !== undefined) {
      updatePayload.caption = body.caption;
    }

    const { data, error } = await supabase
      .from("content_publications")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Failed to update publication" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      publication: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("content_publications")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Publication not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      publication: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}