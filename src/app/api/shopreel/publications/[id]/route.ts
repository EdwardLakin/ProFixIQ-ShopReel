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
        | "queued"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled";
      scheduledFor?: string | null;
      publishedAt?: string | null;
      externalPostId?: string | null;
      externalUrl?: string | null;
      errorMessage?: string | null;
      responseJson?: Json | null;
      attemptCount?: number;
    };

    const updatePayload: {
      status?:
        | "queued"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled";
      scheduled_for?: string | null;
      published_at?: string | null;
      external_post_id?: string | null;
      external_url?: string | null;
      error_message?: string | null;
      response_json?: Json;
      attempt_count?: number;
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
      updatePayload.external_post_id = body.externalPostId;
    }

    if (body.externalUrl !== undefined) {
      updatePayload.external_url = body.externalUrl;
    }

    if (body.errorMessage !== undefined) {
      updatePayload.error_message = body.errorMessage;
    }

    if (body.responseJson !== undefined) {
      updatePayload.response_json = body.responseJson ?? {};
    }

    if (
      typeof body.attemptCount === "number" &&
      Number.isFinite(body.attemptCount)
    ) {
      updatePayload.attempt_count = body.attemptCount;
    }

    const { data, error } = await supabase
      .from("shopreel_publications")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to update publication" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      publication: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shopreel_publications")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Publication not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      publication: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}