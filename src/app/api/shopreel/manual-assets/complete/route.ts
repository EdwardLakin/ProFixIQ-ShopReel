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

    const body = (await req.json()) as {
      assetId?: string;
      files?: Array<{
        filePath: string;
        fileName: string;
        fileType: "image" | "video";
        mimeType: string;
        sizeBytes?: number | null;
        durationSeconds?: number | null;
        bucket?: string | null;
        publicUrl?: string | null;
        sortOrder?: number;
      }>;
    };

    const { assetId, files } = body;

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
        asset_id: asset.id,
        shop_id: asset.shop_id,
        bucket: file.bucket ?? "shopreel-media",
        storage_path: file.filePath,
        public_url: file.publicUrl ?? null,
        file_name: file.fileName,
        mime_type: file.mimeType,
        file_size_bytes: file.sizeBytes ?? null,
        sort_order: file.sortOrder ?? index,
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
    const firstPublicUrl = files[0]?.publicUrl ?? null;

    const { error: updateError } = await supabase
      .from("shopreel_manual_assets")
      .update({
        status: "uploaded",
        primary_file_url: firstPublicUrl,
        duration_seconds: firstVideo?.durationSeconds ?? null,
      } satisfies DB["public"]["Tables"]["shopreel_manual_assets"]["Update"])
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