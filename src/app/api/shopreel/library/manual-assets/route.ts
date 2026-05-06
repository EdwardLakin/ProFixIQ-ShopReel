import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type ManualAssetRow = {
  id: string;
  shop_id: string | null;
  created_by: string | null;
  title: string | null;
  description: string | null;
  asset_type: string;
  status: string;
  content_goal: string | null;
  note: string | null;
  primary_file_url: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  files?: Array<{
    id: string;
    file_name: string | null;
    mime_type: string | null;
    file_size_bytes: number | null;
    storage_path: string;
    bucket: string;
    sort_order: number;
  }>;
};

export async function GET() {
  try {
    const authSupabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to view your library." },
        { status: 401 },
      );
    }

    let shopId: string | null = null;
    try {
      shopId = await getCurrentShopId();
    } catch {
      shopId = null;
    }

    const supabase = createAdminClient();

    let query = supabase
      .from("shopreel_manual_assets")
      .select(`
        id,
        shop_id,
        created_by,
        title,
        description,
        asset_type,
        status,
        content_goal,
        note,
        primary_file_url,
        duration_seconds,
        created_at,
        updated_at,
        files:shopreel_manual_asset_files (
          id,
          file_name,
          mime_type,
          file_size_bytes,
          storage_path,
          bucket,
          sort_order
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (shopId) {
      query = query.or(`created_by.eq.${user.id},shop_id.eq.${shopId}`);
    } else {
      query = query.eq("created_by", user.id);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      assets: (data ?? []) as ManualAssetRow[],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load library assets.",
      },
      { status: 500 },
    );
  }
}
