import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import VideoCreationStudio from "@/features/shopreel/video-creation/components/VideoCreationStudio";
import { listRecentMediaGenerationJobs } from "@/features/shopreel/video-creation/lib/server";
import { listSelectableContentAssets } from "@/features/shopreel/video-creation/lib/assets";
import { getVideoGenerationEnvHealth } from "@/features/shopreel/video-creation/lib/env";

export default async function ShopReelAdvancedVideoCreationPage() {
  const [recentJobs, selectableAssets] = await Promise.all([
    listRecentMediaGenerationJobs(24).catch(() => []),
    listSelectableContentAssets(50).catch(() => []),
  ]);

  const envHealth = getVideoGenerationEnvHealth();

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Advanced Video Studio"
      subtitle="Premium AI command center for generation, series, and render operations."
      actions={
        <>
          <GlassBadge tone={envHealth.state === "configured" ? "copper" : "muted"}>
            {envHealth.state === "configured" ? "Video service connected" : "Setup required"}
          </GlassBadge>
          <Link href="/shopreel/render-queue"><GlassButton variant="ghost">Render queue</GlassButton></Link>
          <Link href="/shopreel/generations"><GlassButton variant="secondary">Open projects</GlassButton></Link>
        </>
      }
    >
      <VideoCreationStudio recentJobs={recentJobs} selectableAssets={selectableAssets} envHealth={envHealth} />
    </GlassShell>
  );
}
