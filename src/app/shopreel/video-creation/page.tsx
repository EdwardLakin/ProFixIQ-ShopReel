import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import VideoBriefWizard from "@/features/shopreel/video-creation/components/VideoBriefWizard";
import { listRecentMediaGenerationJobs } from "@/features/shopreel/video-creation/lib/server";

export default async function ShopReelVideoCreationPage() {
  let recentJobs = [];
  try {
    recentJobs = await listRecentMediaGenerationJobs(24);
  } catch {
    recentJobs = [];
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="AI Video Builder"
      subtitle="Create a 10–30 second video/reel from a prompt, approved concept, or uploaded media direction without starting in a complex editor."
    >
      <VideoBriefWizard recentJobs={recentJobs} />
    </GlassShell>
  );
}
