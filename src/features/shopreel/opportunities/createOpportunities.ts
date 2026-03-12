import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { scoreStorySource } from "./scoreStorySource";

type StorySourceRow = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  tags: string[] | null;
  notes: string[] | null;
};

type CreatorRequestRow = {
  id: string;
  title: string | null;
  topic: string;
  mode: string;
  audience: string | null;
  status: string;
  created_at: string;
  result_payload: Record<string, unknown> | null;
  source_story_source_id: string | null;
};

export async function createOpportunities() {
  const supabase = createAdminClient();
  const legacy = supabase as any;
  const shopId = await getCurrentShopId();

  const [{ data: sources, error: sourceError }, { data: creatorRequests, error: creatorError }] =
    await Promise.all([
      legacy
        .from("shopreel_story_sources")
        .select("id, title, description, kind, tags, notes")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(100),
      legacy
        .from("shopreel_creator_requests")
        .select("id, title, topic, mode, audience, status, created_at, result_payload, source_story_source_id")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  if (creatorError) {
    throw new Error(creatorError.message);
  }

  let created = 0;

  for (const source of (sources ?? []) as StorySourceRow[]) {
    const score = scoreStorySource(source);

    const reason =
      score >= 85
        ? "High-priority story candidate"
        : score >= 65
          ? "Strong story candidate"
          : score >= 45
            ? "Moderate story candidate"
            : "Low-priority story candidate";

    const { error: upsertError } = await legacy
      .from("shopreel_content_opportunities")
      .upsert(
        {
          shop_id: shopId,
          story_source_id: source.id,
          score,
          status: "ready",
          reason,
          metadata: {
            source_kind: source.kind,
            source_title: source.title,
            source_type: "story_source",
          },
        },
        {
          onConflict: "shop_id,story_source_id",
        },
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    created++;
  }

  for (const request of (creatorRequests ?? []) as CreatorRequestRow[]) {
    if (!request.source_story_source_id) continue;

    const payload =
      request.result_payload && typeof request.result_payload === "object"
        ? request.result_payload
        : {};

    const angles = Array.isArray(payload.angles) ? payload.angles : [];
    const bullets = Array.isArray(payload.bullets) ? payload.bullets : [];

    let score = 62;

    if (request.mode === "angle_pack") score += 18;
    if (request.mode === "debunk") score += 12;
    if (request.mode === "stitch") score += 10;
    if (angles.length >= 4) score += 8;
    if (bullets.length >= 3) score += 6;
    if (request.audience) score += 4;

    if (score > 99) score = 99;

    const reason =
      request.mode === "angle_pack"
        ? "Creator angle pack ready to expand into multiple posts"
        : request.mode === "debunk"
          ? "Debunk request can become a corrective response post"
          : request.mode === "stitch"
            ? "Stitch request can become a response-style post"
            : "Creator research prompt can become reusable content";

    const { error: upsertError } = await legacy
      .from("shopreel_content_opportunities")
      .upsert(
        {
          shop_id: shopId,
          story_source_id: request.source_story_source_id,
          score,
          status: "ready",
          reason,
          metadata: {
            source_type: "creator_request",
            creator_request_id: request.id,
            creator_mode: request.mode,
            creator_topic: request.topic,
            creator_title: request.title,
            creator_angle_count: angles.length,
            creator_bullet_count: bullets.length,
          },
        },
        {
          onConflict: "shop_id,story_source_id",
        },
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    created++;
  }

  return { created };
}
