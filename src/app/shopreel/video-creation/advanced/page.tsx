import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import VideoCreationStudio from "@/features/shopreel/video-creation/components/VideoCreationStudio";
import { listRecentMediaGenerationJobs } from "@/features/shopreel/video-creation/lib/server";
import { listSelectableContentAssets } from "@/features/shopreel/video-creation/lib/assets";

export default async function ShopReelAdvancedVideoCreationPage() {
  const [recentJobs, selectableAssets] = await Promise.all([
    listRecentMediaGenerationJobs(24).catch(() => []),
    listSelectableContentAssets(50).catch(() => []),
  ]);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Advanced Video Studio"
      subtitle="Power-user media generation controls for providers, assets, series, storyboards, and manual job management."
    >
      <VideoCreationStudio recentJobs={recentJobs} selectableAssets={selectableAssets} />
    </GlassShell>
  );
}
