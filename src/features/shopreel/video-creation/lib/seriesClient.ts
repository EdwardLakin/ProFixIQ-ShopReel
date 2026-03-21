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

  const sceneOrder =
    typeof settings.series_scene_order === "number"
      ? settings.series_scene_order
      : typeof settings.series_scene_order === "string"
        ? Number(settings.series_scene_order)
        : null;

  const totalScenes =
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
    sceneOrder: Number.isFinite(sceneOrder ?? NaN) ? Number(sceneOrder) : null,
    totalScenes: Number.isFinite(totalScenes ?? NaN) ? Number(totalScenes) : null,
    sourceMode,
  };
}

export type MediaJobSeriesGroup = {
  key: string;
  title: string;
  totalScenes: number | null;
  sourceMode: "assets" | "ai" | null;
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
      sourceMode: info.sourceMode,
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
