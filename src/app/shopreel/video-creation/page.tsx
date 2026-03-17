import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import VideoCreationStudio from "@/features/shopreel/video-creation/components/VideoCreationStudio";
import { listRecentMediaGenerationJobs } from "@/features/shopreel/video-creation/lib/server";
import { listSelectableContentAssets } from "@/features/shopreel/video-creation/lib/assets";

export default async function ShopReelVideoCreationPage() {
  const [recentJobs, selectableAssets] = await Promise.all([
    listRecentMediaGenerationJobs(24),
    listSelectableContentAssets(50),
  ]);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Video Creation"
      subtitle="Generate visuals, clips, and assembled reels with a serious AI media studio workflow."
    >
      <ShopReelNav />
      <VideoCreationStudio
        recentJobs={recentJobs}
        selectableAssets={selectableAssets}
      />
    </GlassShell>
  );
}
