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

    const [{ data: storyRows, error: storyError }, { data: creatorRows, error: creatorError }] =
      await Promise.all([
        legacy
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
          .limit(limit),
        legacy
          .from("shopreel_creator_requests")
          .select(`
            id,
            mode,
            status,
            title,
            topic,
            audience,
            tone,
            platform_focus,
            source_generation_id,
            result_payload,
            created_at
          `)
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false })
          .limit(limit),
      ]);

    if (storyError) {
      throw new Error(storyError.message);
    }

    if (creatorError) {
      throw new Error(creatorError.message);
    }

    const storyItems = (storyRows ?? []).map((row: any) => ({
      id: row.id,
      kind: "story_opportunity",
      title: row.shopreel_story_sources?.title ?? "Untitled",
      contentType: row.shopreel_story_sources?.kind ?? "story_source",
      score: typeof row.score === "number" ? row.score : Number(row.score ?? 0),
      status: row.status,
      source: row.shopreel_story_sources?.origin ?? "shopreel",
      sourceType:
        row.shopreel_story_sources?.origin === "manual_upload"
          ? "manual_upload"
          : "shop_data",
      createdAt: row.shopreel_story_sources?.created_at ?? row.created_at,
      generationId: null,
      creatorMode: null,
      summary: row.reason ?? null,
    }));

    const creatorItems = (creatorRows ?? []).map((row: any) => {
      const resultPayload =
        row.result_payload && typeof row.result_payload === "object" && !Array.isArray(row.result_payload)
          ? row.result_payload
          : {};

      return {
        id: row.id,
        kind: "creator_request",
        title: row.title ?? row.topic ?? "Creator prompt",
        contentType: row.mode ?? "creator_request",
        score: 90,
        status: row.status,
        source: "creator_mode",
        sourceType: "creator_prompt",
        createdAt: row.created_at,
        generationId: row.source_generation_id ?? null,
        creatorMode: row.mode ?? null,
        summary:
          typeof resultPayload.summary === "string"
            ? resultPayload.summary
            : typeof row.topic === "string"
              ? row.topic
              : null,
      };
    });

    const items = [...creatorItems, ...storyItems]
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();

        if (a.kind === "creator_request" && b.kind !== "creator_request") return -1;
        if (a.kind !== "creator_request" && b.kind === "creator_request") return 1;

        if ((b.score ?? 0) !== (a.score ?? 0)) {
          return (b.score ?? 0) - (a.score ?? 0);
        }

        return timeB - timeA;
      })
      .slice(0, limit);

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
