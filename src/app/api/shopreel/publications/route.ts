import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createPublication } from "@/features/shopreel/publishing/lib/createPublication";
import { enqueuePublishJob } from "@/features/shopreel/publishing/lib/enqueuePublishJob";
import { withCanonicalApiHeaders } from "@/features/shopreel/server/apiOwnership";
import { requireUserActionTenantContext, toEndpointErrorResponse } from "@/features/shopreel/server/endpointPolicy";

export async function GET() {
  try {
    const { shopId } = await requireUserActionTenantContext();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("content_publications")
      .select("*")
      .eq("tenant_shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return withCanonicalApiHeaders(NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      ));
    }

    return withCanonicalApiHeaders(NextResponse.json({
      ok: true,
      items: data ?? [],
    }));
  } catch (error) {
    return withCanonicalApiHeaders(toEndpointErrorResponse(error, "Failed to load publications"));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shopId, userId } = await requireUserActionTenantContext();
    const body = (await req.json().catch(() => ({}))) as {
      contentEventId?: string;
      contentPieceId?: string | null;
      contentAssetId?: string | null;
      platformAccountId?: string | null;
      platform?:
        | "instagram"
        | "facebook"
        | "youtube"
        | "tiktok"
        | "blog"
        | "linkedin"
        | "google_business"
        | "email";
      scheduledFor?: string | null;
      publishMode?: "manual" | "scheduled" | "autopilot";
      enqueue?: boolean;
      title?: string | null;
      caption?: string | null;
      videoId?: string | null;
    };

    if (!body.contentEventId || !body.platform) {
      return withCanonicalApiHeaders(NextResponse.json(
        { ok: false, error: "contentEventId and platform are required" },
        { status: 400 },
      ));
    }

    const publication = await createPublication({
      shopId,
      contentEventId: body.contentEventId,
      contentPieceId: body.contentPieceId ?? null,
      contentAssetId: body.contentAssetId ?? null,
      platformAccountId: body.platformAccountId ?? null,
      platform: body.platform,
      scheduledFor: body.scheduledFor ?? null,
      publishMode: body.publishMode ?? "manual",
      createdBy: userId,
      title: body.title ?? null,
      caption: body.caption ?? null,
      videoId: body.videoId ?? null,
    });

    let job = null;

    if (body.enqueue !== false) {
      job = await enqueuePublishJob({
        shopId,
        publicationId: publication.id,
        runAfter: body.scheduledFor ?? null,
      });
    }

    return withCanonicalApiHeaders(NextResponse.json({
      ok: true,
      publication,
      job,
    }));
  } catch (error) {
    return withCanonicalApiHeaders(toEndpointErrorResponse(error, "Failed to create publication"));
  }
}
