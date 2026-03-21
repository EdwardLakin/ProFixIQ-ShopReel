import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Database, Json } from "@/types/supabase";

type MediaJob = Database["public"]["Tables"]["shopreel_media_generation_jobs"]["Row"];

function asObject(value: Json | null | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json | undefined>)
    : {};
}

export type MediaJobSeriesInfo = {
  seriesKey: string | null;
  seriesTitle: string | null;
  sceneLabel: string | null;
  sceneOrder: number | null;
  totalScenes: number | null;
  sourceMode: "assets" | "ai" | null;
};

export function getMediaJobSeriesInfo(
  job: Pick<MediaJob, "id" | "settings" | "title">
): MediaJobSeriesInfo {
  const settings = asObject(job.settings);

  const seriesKey =
    typeof settings.series_key === "string" && settings.series_key.trim().length > 0
      ? settings.series_key
      : null;

  const seriesTitle =
    typeof settings.series_title === "string" && settings.series_title.trim().length > 0
      ? settings.series_title
      : null;

  const sceneLabel =
    typeof settings.series_scene_label === "string" && settings.series_scene_label.trim().length > 0
      ? settings.series_scene_label
      : null;

  const rawSceneOrder =
    typeof settings.series_scene_order === "number"
      ? settings.series_scene_order
      : typeof settings.series_scene_order === "string"
        ? Number(settings.series_scene_order)
        : null;

  const rawTotalScenes =
    typeof settings.series_total_scenes === "number"
      ? settings.series_total_scenes
      : typeof settings.series_total_scenes === "string"
        ? Number(settings.series_total_scenes)
        : null;

  const sourceMode =
    settings.series_source_mode === "assets"
      ? "assets"
      : settings.series_source_mode === "ai"
        ? "ai"
        : null;

  return {
    seriesKey,
    seriesTitle,
    sceneLabel,
    sceneOrder: Number.isFinite(rawSceneOrder ?? NaN) ? Number(rawSceneOrder) : null,
    totalScenes: Number.isFinite(rawTotalScenes ?? NaN) ? Number(rawTotalScenes) : null,
    sourceMode,
  };
}

export type MediaJobSeriesGroup = {
  key: string;
  title: string;
  totalScenes: number | null;
  sourceMode: "assets" | "ai";
  jobs: MediaJob[];
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
};

export function groupMediaJobsIntoSeries(jobs: MediaJob[]): MediaJobSeriesGroup[] {
  const map = new Map<string, MediaJobSeriesGroup>();

  for (const job of jobs) {
    const info = getMediaJobSeriesInfo(job);
    if (!info.seriesKey) continue;

    const existing = map.get(info.seriesKey);
    if (existing) {
      existing.jobs.push(job);
      if (job.status === "queued") existing.queuedCount += 1;
      if (job.status === "processing") existing.processingCount += 1;
      if (job.status === "completed") existing.completedCount += 1;
      if (job.status === "failed") existing.failedCount += 1;
      continue;
    }

    map.set(info.seriesKey, {
      key: info.seriesKey,
      title: info.seriesTitle ?? job.title ?? "Untitled series",
      totalScenes: info.totalScenes,
      sourceMode: info.sourceMode ?? "ai",
      jobs: [job],
      queuedCount: job.status === "queued" ? 1 : 0,
      processingCount: job.status === "processing" ? 1 : 0,
      completedCount: job.status === "completed" ? 1 : 0,
      failedCount: job.status === "failed" ? 1 : 0,
    });
  }

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      jobs: [...group.jobs].sort((a, b) => {
        const aInfo = getMediaJobSeriesInfo(a);
        const bInfo = getMediaJobSeriesInfo(b);
        return (aInfo.sceneOrder ?? 999) - (bInfo.sceneOrder ?? 999);
      }),
    }))
    .sort((a, b) => {
      const aDate = new Date(a.jobs[0]?.created_at ?? 0).getTime();
      const bDate = new Date(b.jobs[0]?.created_at ?? 0).getTime();
      return bDate - aDate;
    });
}

export type PlannedManualSeriesScene = {
  sceneOrder: number;
  sceneLabel: string;
  title: string;
  prompt: string;
  durationSeconds: number;
};

export function planManualSeriesScenes(input: {
  title: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  visualMode: string;
  aspectRatio: string;
  durationSeconds: number;
}): PlannedManualSeriesScene[] {
  const base = input.prompt.trim();

  const continuity = [
    "Use the same product, subject, location family, camera language, framing logic, color feel, and overall mood across all clips.",
    "Do not change subject identity between scenes.",
    `Style: ${input.style}.`,
    `Visual mode: ${input.visualMode}.`,
    `Aspect ratio: ${input.aspectRatio}.`,
    input.negativePrompt?.trim() ? `Avoid: ${input.negativePrompt.trim()}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    {
      sceneOrder: 1,
      sceneLabel: "Hook",
      title: `${input.title} — Hook`,
      prompt: `${base} Create the opening hook. Make it attention-grabbing and instantly clear. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 2,
      sceneLabel: "Problem",
      title: `${input.title} — Problem`,
      prompt: `${base} Show the pain point, friction, or contrast. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 3,
      sceneLabel: "Solution",
      title: `${input.title} — Solution`,
      prompt: `${base} Show the solution, transformation, or improved approach. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 4,
      sceneLabel: "Outcome",
      title: `${input.title} — Outcome`,
      prompt: `${base} Show the result, payoff, confidence, or finished outcome. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
  ];
}

export async function listMediaJobsForSeries(seriesKey: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_media_generation_jobs")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((job) => getMediaJobSeriesInfo(job).seriesKey === seriesKey)
    .sort((a, b) => {
      const aInfo = getMediaJobSeriesInfo(a);
      const bInfo = getMediaJobSeriesInfo(b);
      return (aInfo.sceneOrder ?? 999) - (bInfo.sceneOrder ?? 999);
    });
}
