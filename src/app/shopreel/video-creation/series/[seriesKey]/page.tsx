import { notFound } from "next/navigation";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import SeriesDetailClient from "@/features/shopreel/video-creation/components/SeriesDetailClient";
import { getSeriesJobsByKey } from "@/features/shopreel/video-creation/lib/server";

export default async function ShopReelSeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesKey: string }>;
}) {
  const { seriesKey } = await params;
  const jobs = await getSeriesJobsByKey(seriesKey);

  if (jobs.length === 0) {
    notFound();
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Series Detail"
      subtitle="Manage a grouped build series from one place."
    >
      <SeriesDetailClient seriesKey={seriesKey} jobs={jobs} />
    </GlassShell>
  );
}
