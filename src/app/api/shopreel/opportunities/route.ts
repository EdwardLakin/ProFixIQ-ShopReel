// src/app/api/shopreel/opportunities/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

type OpportunityRow = {
  id: string;
  title: string;
  status: string;
  content_type: string;
  ai_score: number | null;
  source_asset_id: string | null;
  created_at: string;
};

type ShopUserLite = {
  shop_id: string;
};

async function resolveShopId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SHOP_ID;
  }

  const admin = createAdminClient();

  const { data: membership } = await admin
    .from("shop_users")
    .select("shop_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (membership as ShopUserLite | null)?.shop_id ?? DEFAULT_SHOP_ID;
}

export async function GET(req: NextRequest) {
  try {
    const shopId = await resolveShopId();
    const supabase = createAdminClient();

    const url = new URL(req.url);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
      100,
    );

    const { data, error } = await supabase
      .from("videos")
      .select("id,title,status,content_type,ai_score,source_asset_id,created_at")
      .eq("shop_id", shopId)
      .in("status", ["draft", "queued", "processing", "ready"])
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = ((data ?? []) as OpportunityRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      contentType: row.content_type,
      score: row.ai_score,
      status: row.status,
      source: row.source_asset_id ? "Manual Upload" : "Shop Data",
      sourceType: row.source_asset_id ? "manual_upload" : "shop_data",
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}