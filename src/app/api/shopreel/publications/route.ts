import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { createPublication } from "@/features/shopreel/publishing/lib/createPublication";
import { enqueuePublishJob } from "@/features/shopreel/publishing/lib/enqueuePublishJob";

type ShopUserLite = {
  shop_id: string;
};

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

async function resolveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { shopId: DEFAULT_SHOP_ID, userId: null as string | null };
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("shop_users")
    .select("shop_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return {
    shopId: (membership as ShopUserLite | null)?.shop_id ?? DEFAULT_SHOP_ID,
    userId: user.id,
  };
}

export async function GET() {
  try {
    const { shopId } = await resolveContext();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("content_publications")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      items: data ?? [],
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

export async function POST(req: NextRequest) {
  try {
    const { shopId, userId } = await resolveContext();
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
      return NextResponse.json(
        { ok: false, error: "contentEventId and platform are required" },
        { status: 400 },
      );
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

    return NextResponse.json({
      ok: true,
      publication,
      job,
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