import { createAdminClient } from "@/lib/supabase/server";

type SignalRow = {
  content_type: string;
  avg_engagement_score: number | null;
  total_views: number | null;
  total_posts: number | null;
  last_posted_at: string | null;
  notes: Record<string, unknown> | null;
};

type MemoryRow = {
  memory_key: string;
  memory_value: Record<string, unknown> | null;
};

export type OptimizationSnapshot = {
  shopId: string;
  updatedAt: string;
  preferredContentTypes: string[];
  contentTypeBoosts: Record<string, number>;
  winningHookPatterns: string[];
  notes: Record<string, unknown>;
};

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeHookPatterns(memoryValue: Record<string, unknown>): string[] {
  const topContentTypes = Array.isArray(memoryValue.topContentTypes)
    ? memoryValue.topContentTypes
    : [];

  return topContentTypes
    .map((row) => safeObject(row))
    .map((row) => row.content_type)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, 5);
}

export async function getOptimizationSnapshot(
  shopId: string,
): Promise<OptimizationSnapshot> {
  const supabase = createAdminClient();

  const [{ data: signalData, error: signalError }, { data: memoryData, error: memoryError }] =
    await Promise.all([
      supabase
        .from("shop_content_signals")
        .select("content_type, avg_engagement_score, total_views, total_posts, last_posted_at, notes")
        .eq("shop_id", shopId)
        .order("avg_engagement_score", { ascending: false }),
      supabase
        .from("shop_marketing_memory")
        .select("memory_key, memory_value")
        .eq("shop_id", shopId)
        .in("memory_key", ["top_content_patterns", "automation_loop_snapshot"]),
    ]);

  if (signalError) {
    throw new Error(signalError.message);
  }

  if (memoryError) {
    throw new Error(memoryError.message);
  }

  const signals = ((signalData ?? []) as SignalRow[]).filter(
    (row) => typeof row.content_type === "string" && row.content_type.length > 0,
  );

  const memories = (memoryData ?? []) as MemoryRow[];
  const memoryByKey = new Map<string, Record<string, unknown>>();

  for (const row of memories) {
    memoryByKey.set(row.memory_key, safeObject(row.memory_value));
  }

  const contentTypeBoosts: Record<string, number> = {};

  for (const signal of signals) {
    const engagement = Number(signal.avg_engagement_score ?? 0);
    const views = Number(signal.total_views ?? 0);
    const posts = Number(signal.total_posts ?? 0);

    let boost = 0;
    if (engagement >= 0.2) boost += 20;
    else if (engagement >= 0.1) boost += 12;
    else if (engagement >= 0.05) boost += 6;

    if (views >= 10000) boost += 10;
    else if (views >= 2500) boost += 6;
    else if (views >= 500) boost += 3;

    if (posts >= 5) boost += 4;

    contentTypeBoosts[signal.content_type] = boost;
  }

  const topPatternMemory = memoryByKey.get("top_content_patterns") ?? {};
  const preferredContentTypes = signals.map((row) => row.content_type);
  const winningHookPatterns = normalizeHookPatterns(topPatternMemory);

  return {
    shopId,
    updatedAt: new Date().toISOString(),
    preferredContentTypes,
    contentTypeBoosts,
    winningHookPatterns,
    notes: {
      signalsCount: signals.length,
      memoryKeys: Array.from(memoryByKey.keys()),
    },
  };
}
