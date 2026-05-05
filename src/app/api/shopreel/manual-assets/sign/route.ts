
// src/app/api/shopreel/manual-assets/sign/route.ts

import { NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/lib/supabase/server";

import { buildShopReelManualStoragePath } from "@/features/shopreel/manual/lib/buildStoragePath";

import {

  SHOPREEL_MANUAL_UPLOAD_MAX_BYTES,

  SHOPREEL_MANUAL_UPLOAD_MAX_LABEL,

  formatBytes,

} from "@/features/shopreel/manual/lib/uploadLimits";

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

    const { assetId, fileName, mimeType, sizeBytes } = body as {

      assetId?: string;

      fileName?: string;

      mimeType?: string;

      sizeBytes?: number;

    };

    if (!assetId || !fileName || !mimeType) {

      return NextResponse.json(

        { error: "assetId, fileName, and mimeType are required" },

        { status: 400 },

      );

    }

    if (typeof sizeBytes === "number" && sizeBytes > SHOPREEL_MANUAL_UPLOAD_MAX_BYTES) {

      return NextResponse.json(

        {

          error: `${fileName} is ${formatBytes(sizeBytes)}. The current upload limit is ${SHOPREEL_MANUAL_UPLOAD_MAX_LABEL}. Trim/compress the video or upload screenshots for this MVP test.`,

        },

        { status: 413 },

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

      console.error("[shopreel/manual-assets/sign] signed upload failed", {

        assetId,

        bucket: "shopreel-media",

        path,

        error: error?.message,

      });

      return NextResponse.json(

        { error: "Unable to prepare media upload. The ShopReel storage bucket is missing or unavailable." },

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

