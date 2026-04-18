import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { normalizeOpportunityStatus } from "@/features/shopreel/opportunities/lib/status";

type OpportunityItem = {
  id: string;
  kind: "story_opportunity" | "creator_request";
  title: string;
  contentType: string;
  score: number | null;
  status: string;
  source: string;
  sourceType: "manual_upload" | "shop_data" | "creator_prompt";
  createdAt: string;
  generationId: string | null;
  creatorMode: string | null;
  summary: string | null;
};

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function dedupeItems(items: OpportunityItem[]): OpportunityItem[] {
  const seen = new Set<string>();
  const result: OpportunityItem[] = [];

  for (const item of items) {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

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

    const storySourceIds = Array.from(
      new Set(
        (data ?? [])
          .map((row: any) =>
            typeof row.story_source_id === "string" ? row.story_source_id : null,
          )
          .filter((value: string | null): value is string => !!value),
      ),
    );

    const generationByStorySourceId = new Map<
      string,
      {
        id: string;
        outputType: string | null;
      }
    >();

    if (storySourceIds.length > 0) {
      const { data: generations, error: generationError } = await legacy
        .from("shopreel_story_generations")
        .select("id, story_source_id, generation_metadata")
        .eq("shop_id", shopId)
        .in("story_source_id", storySourceIds)
        .order("created_at", { ascending: false });

      if (generationError) {
        throw new Error(generationError.message);
      }

      for (const generation of generations ?? []) {
        if (!generation?.story_source_id) continue;
        if (generationByStorySourceId.has(generation.story_source_id)) continue;

        const generationMetadata = objectRecord(generation.generation_metadata);

        generationByStorySourceId.set(generation.story_source_id, {
          id: generation.id,
          outputType:
            typeof generationMetadata.output_type === "string"
              ? generationMetadata.output_type
              : null,
        });
      }
    }

    const creatorRequestIds = Array.from(
      new Set(
        (data ?? [])
          .map((row: any) => {
            const metadata = objectRecord(row.metadata);
            return typeof metadata.creator_request_id === "string"
              ? metadata.creator_request_id
              : null;
          })
          .filter((value: string | null): value is string => !!value),
      ),
    );

    const creatorRequestById = new Map<
      string,
      {
        id: string;
        source_generation_id: string | null;
        mode: string | null;
      }
    >();

    if (creatorRequestIds.length > 0) {
      const { data: creatorRequests, error: creatorRequestError } = await legacy
        .from("shopreel_creator_requests")
        .select("id, source_generation_id, mode")
        .eq("shop_id", shopId)
        .in("id", creatorRequestIds);

      if (creatorRequestError) {
        throw new Error(creatorRequestError.message);
      }

      for (const request of creatorRequests ?? []) {
        creatorRequestById.set(request.id, {
          id: request.id,
          source_generation_id:
            typeof request.source_generation_id === "string"
              ? request.source_generation_id
              : null,
          mode: typeof request.mode === "string" ? request.mode : null,
        });
      }
    }

    const items = dedupeItems(
      (data ?? []).map((row: any) => {
        const metadata = objectRecord(row.metadata);
        const storySource = row.shopreel_story_sources ?? null;
        const isCreator =
          metadata.source_type === "creator_request" ||
          storySource?.origin === "creator_mode";

        const creatorRequestId =
          typeof metadata.creator_request_id === "string"
            ? metadata.creator_request_id
            : null;

        const creatorRequest = creatorRequestId
          ? creatorRequestById.get(creatorRequestId) ?? null
          : null;

        const generationFromSource =
          typeof row.story_source_id === "string"
            ? generationByStorySourceId.get(row.story_source_id) ?? null
            : null;

        const creatorMode =
          typeof metadata.creator_mode === "string"
            ? metadata.creator_mode
            : typeof metadata.creator_mode_type === "string"
              ? metadata.creator_mode_type
              : creatorRequest?.mode ?? null;

        const generationId =
          typeof metadata.generation_id === "string"
            ? metadata.generation_id
            : creatorRequest?.source_generation_id ??
              generationFromSource?.id ??
              null;

        return {
          id: isCreator && creatorRequestId ? creatorRequestId : row.id,
          kind: isCreator ? "creator_request" : "story_opportunity",
          title:
            storySource?.title ??
            (typeof metadata.creator_title === "string"
              ? metadata.creator_title
              : typeof metadata.source_title === "string"
                ? metadata.source_title
                : "Untitled"),
          contentType:
            creatorMode ??
            (typeof metadata.output_type === "string"
              ? metadata.output_type
              : storySource?.kind ?? "story_source"),
          score:
            typeof row.score === "number" ? row.score : Number(row.score ?? 0),
          status: normalizeOpportunityStatus(row.status, "ready"),
          source:
            typeof storySource?.origin === "string"
              ? storySource.origin
              : "shopreel",
          sourceType: isCreator
            ? "creator_prompt"
            : storySource?.origin === "manual_upload"
              ? "manual_upload"
              : "shop_data",
          createdAt:
            typeof storySource?.created_at === "string"
              ? storySource.created_at
              : typeof row.created_at === "string"
                ? row.created_at
                : new Date().toISOString(),
          generationId,
          creatorMode,
          summary:
            typeof row.reason === "string"
              ? row.reason
              : typeof metadata.research_summary === "string"
                ? metadata.research_summary
                : null,
        } satisfies OpportunityItem;
      }),
    );

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
