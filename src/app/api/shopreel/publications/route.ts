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
      .from("shopreel_publications")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shopId, userId } = await resolveContext();
    const body = (await req.json().catch(() => ({}))) as {
      videoId?: string;
      platform?: "instagram_reels" | "facebook" | "youtube_shorts" | "tiktok";
      scheduledFor?: string | null;
      publishMode?: "manual" | "scheduled" | "autopilot";
      enqueue?: boolean;
    };

    if (!body.videoId || !body.platform) {
      return NextResponse.json(
        { error: "videoId and platform are required" },
        { status: 400 },
      );
    }

    const publication = await createPublication({
      shopId,
      videoId: body.videoId,
      platform: body.platform,
      scheduledFor: body.scheduledFor ?? null,
      publishMode: body.publishMode ?? "manual",
      createdBy: userId,
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
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
