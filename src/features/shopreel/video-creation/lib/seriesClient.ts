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

export function getMediaJobSeriesInfo(job: Pick<MediaJob, "id" | "settings" | "title">): MediaJobSeriesInfo {
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
  jobs: MediaJob[];
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  sourceMode: "assets" | "ai";
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
      jobs: [job],
      queuedCount: job.status === "queued" ? 1 : 0,
      processingCount: job.status === "processing" ? 1 : 0,
      completedCount: job.status === "completed" ? 1 : 0,
      failedCount: job.status === "failed" ? 1 : 0,
      sourceMode: info.sourceMode ?? "ai",
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
      const aDate = Math.max(...a.jobs.map((job) => new Date(job.created_at).getTime()));
      const bDate = Math.max(...b.jobs.map((job) => new Date(job.created_at).getTime()));
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
    "Maintain the same subject identity, same environment family, same product or brand world, same camera language, same lighting family, and same overall mood across every scene.",
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
      prompt: `${base} Create the opening hook. Highly attention-grabbing. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 2,
      sceneLabel: "Problem",
      title: `${input.title} — Problem`,
      prompt: `${base} Show the problem, tension, friction, or pain point. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 3,
      sceneLabel: "Solution",
      title: `${input.title} — Solution`,
      prompt: `${base} Show the solution, shift, product, workflow, or transformation. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
    {
      sceneOrder: 4,
      sceneLabel: "Outcome",
      title: `${input.title} — Outcome`,
      prompt: `${base} Show the payoff, result, confidence, or finished outcome. ${continuity}`,
      durationSeconds: input.durationSeconds,
    },
  ];
}
