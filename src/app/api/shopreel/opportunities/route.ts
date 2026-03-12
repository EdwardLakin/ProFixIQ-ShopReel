import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

export async function GET(req: Request) {
  try {
    const shopId = await getCurrentShopId();
    const { searchParams } = new URL(req.url);
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 50;

    const supabase = createAdminClient();
    const legacy = supabase as any;

    const { data, error } = await legacy
      .from("shopreel_content_opportunities")
      .select(`
        id,
        score,
        status,
        reason,
        created_at,
        story_source_id,
        metadata,
        shopreel_story_sources!inner (
          id,
          title,
          kind,
          origin,
          created_at
        )
      `)
      .eq("shop_id", shopId)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const items = (data ?? []).map((row: any) => {
      const metadata =
        row.metadata && typeof row.metadata === "object" ? row.metadata : {};

      const sourceType =
        metadata.source_type === "creator_request"
          ? "creator_request"
          : row.shopreel_story_sources?.origin === "manual_upload"
            ? "manual_upload"
            : "shop_data";

      return {
        id: row.id,
        title: row.shopreel_story_sources?.title ?? metadata.creator_title ?? "Untitled",
        contentType:
          metadata.creator_mode ??
          row.shopreel_story_sources?.kind ??
          "story_source",
        score: typeof row.score === "number" ? row.score : Number(row.score ?? 0),
        status: row.status,
        source: row.shopreel_story_sources?.origin ?? "shopreel",
        sourceType,
        createdAt: row.shopreel_story_sources?.created_at ?? row.created_at,
      };
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load opportunities";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
