import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type DB = Database;

export async function POST(req: Request) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Please sign in to create content." }, { status: 401 });
    }

    const body = (await req.json()) as {
      title?: string;
      description?: string | null;
      assetType?: "image" | "video" | "mixed";
      contentGoal?: string | null;
      note?: string | null;
      platformTargets?: string[];
      tags?: string[];
    };

    const { title, description, assetType, contentGoal, note } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!assetType || !["image", "video", "mixed"].includes(assetType)) {
      return NextResponse.json({ error: "Valid assetType is required" }, { status: 400 });
    }

    let shopId: string | null = null;
    const { data: shopData } = await authSupabase.rpc("current_tenant_shop_id");
    if (shopData) {
      shopId = String(shopData);
    }

    const supabase = createAdminClient();

    const insertRow: DB["public"]["Tables"]["shopreel_manual_assets"]["Insert"] = {
      shop_id: shopId,
      created_by: user.id,
      title: title.trim(),
      description: description ?? null,
      asset_type: assetType,
      status: "draft",
      content_goal: contentGoal ?? null,
      note: note ?? null,
      primary_file_url: null,
      duration_seconds: null,
    };

    const { data, error } = await supabase
      .from("shopreel_manual_assets")
      .insert(insertRow)
      .select("id, shop_id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create manual asset" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      assetId: data.id,
      shopId: data.shop_id,
      standalone: !data.shop_id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
