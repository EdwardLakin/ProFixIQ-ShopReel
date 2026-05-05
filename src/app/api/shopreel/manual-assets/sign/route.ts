// src/app/api/shopreel/manual-assets/sign/route.ts

import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { buildShopReelManualStoragePath } from "@/features/shopreel/manual/lib/buildStoragePath";

export async function POST(req: Request) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Please sign in to upload media." }, { status: 401 });
    }

    const body = await req.json();
    const { assetId, fileName, mimeType } = body as {
      assetId?: string;
      fileName?: string;
      mimeType?: string;
    };

    if (!assetId || !fileName || !mimeType) {
      return NextResponse.json(
        { error: "assetId, fileName, and mimeType are required" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: asset, error: assetError } = await supabase
      .from("shopreel_manual_assets")
      .select("id, shop_id, created_by")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Manual asset not found" }, { status: 404 });
    }

    if (asset.created_by !== user.id) {
      return NextResponse.json({ error: "Manual asset not found" }, { status: 404 });
    }

    const path = buildShopReelManualStoragePath({
      shopId: asset.shop_id ?? user.id,
      assetId: asset.id,
      fileName,
    });

    const { data, error } = await supabase.storage
      .from("shopreel-media")
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create signed upload URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      path,
      token: data.token,
      bucket: "shopreel-media",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
