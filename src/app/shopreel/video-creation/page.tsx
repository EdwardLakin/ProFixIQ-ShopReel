import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import VideoCreationStudio from "@/features/shopreel/video-creation/components/VideoCreationStudio";
import { listRecentMediaGenerationJobs } from "@/features/shopreel/video-creation/lib/server";

export default async function ShopReelVideoCreationPage() {
  const recentJobs = await listRecentMediaGenerationJobs(24);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Video Creation"
      subtitle="Generate visuals, clips, and assembled reels with a serious AI media studio workflow."
    >
      <ShopReelNav />
      <VideoCreationStudio recentJobs={recentJobs} />
    </GlassShell>
  );
}
