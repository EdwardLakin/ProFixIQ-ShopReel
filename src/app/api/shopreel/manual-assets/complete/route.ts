// src/app/api/shopreel/manual-assets/complete/route.ts

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
    const { assetId, files } = body as {
      assetId?: string;
      files?: Array<{
        filePath: string;
        fileName: string;
        fileType: "image" | "video";
        mimeType: string;
        sizeBytes?: number | null;
        width?: number | null;
        height?: number | null;
        durationSeconds?: number | null;
        sortOrder?: number;
      }>;
    };

    if (!assetId || !files?.length) {
      return NextResponse.json(
        { error: "assetId and files are required" },
        { status: 400 },
      );
    }

    const { data: asset, error: assetError } = await supabase
      .from("shopreel_manual_assets")
      .select("id, shop_id")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Manual asset not found" },
        { status: 404 },
      );
    }

    const rows: DB["public"]["Tables"]["shopreel_manual_asset_files"]["Insert"][] =
      files.map((file, index) => ({
        shop_id: asset.shop_id,
        manual_asset_id: asset.id,
        file_path: file.filePath,
        file_url: null,
        file_name: file.fileName,
        file_type: file.fileType,
        mime_type: file.mimeType,
        sort_order: file.sortOrder ?? index,
        width: file.width ?? null,
        height: file.height ?? null,
        duration_seconds: file.durationSeconds ?? null,
        size_bytes: file.sizeBytes ?? null,
        metadata_json: {},
      }));

    const { error: insertError } = await supabase
      .from("shopreel_manual_asset_files")
      .insert(rows);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message ?? "Failed to record uploaded files" },
        { status: 500 },
      );
    }

    const firstVideo = files.find((f) => f.fileType === "video");
    const firstPath = files[0]?.filePath ?? null;

    const { error: updateError } = await supabase
      .from("shopreel_manual_assets")
      .update({
        status: "uploaded",
        primary_file_url: firstPath,
        duration_seconds: firstVideo?.durationSeconds ?? null,
      } as DB["public"]["Tables"]["shopreel_manual_assets"]["Update"])
      .eq("id", asset.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Failed to finalize manual asset" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      assetId: asset.id,
      fileCount: files.length,
      status: "uploaded",
      readyForGeneration: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}