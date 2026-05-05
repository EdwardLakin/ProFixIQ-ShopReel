import GlassShell from "@/features/shopreel/ui/system/GlassShell";
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
      title="AI Video Builder"
      subtitle="Turn an approved idea, prompt, or uploaded media into a short-form video plan with style, voiceover, music direction, and render handoff."
    >
      <VideoCreationStudio
        recentJobs={recentJobs}
        selectableAssets={selectableAssets}
      />
    </GlassShell>
  );
}
