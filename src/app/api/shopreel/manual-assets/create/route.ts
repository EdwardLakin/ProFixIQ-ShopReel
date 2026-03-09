// src/app/api/shopreel/manual-assets/create/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type DB = Database;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      assetType,
      contentGoal,
      note,
      platformTargets = [],
      tags = [],
    } = body as {
      title?: string;
      description?: string | null;
      assetType?: "image" | "video" | "mixed";
      contentGoal?: string | null;
      note?: string | null;
      platformTargets?: string[];
      tags?: string[];
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!assetType || !["image", "video", "mixed"].includes(assetType)) {
      return NextResponse.json(
        { error: "Valid assetType is required" },
        { status: 400 },
      );
    }

    const { data: shopData, error: shopError } = await supabase.rpc(
      "current_shop_id",
    );

    if (shopError || !shopData) {
      return NextResponse.json(
        { error: "Unable to resolve current shop" },
        { status: 400 },
      );
    }

    const shopId = String(shopData);

    const insertRow: DB["public"]["Tables"]["shopreel_manual_assets"]["Insert"] =
      {
        shop_id: shopId,
        created_by: user.id,
        title: title.trim(),
        description: description ?? null,
        source_type: "manual_upload",
        asset_type: assetType,
        status: "draft",
        content_goal: contentGoal ?? null,
        note: note ?? null,
        platform_targets: platformTargets,
        tags,
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}