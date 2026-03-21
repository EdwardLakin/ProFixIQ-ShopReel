"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import { formatShopReelStatus } from "@/features/shopreel/lib/uiLabels";

type CampaignRow = {
  id: string;
  title: string;
  core_idea: string;
  audience: string | null;
  offer: string | null;
  campaign_goal: string | null;
  status: string;
  platform_focus: string[];
  created_at: string;
};

type CampaignItemRow = {
  id: string;
  title: string;
  angle: string;
  prompt: string;
  status: string;
  aspect_ratio: string;
  style: string | null;
  visual_mode: string | null;
  media_job_id: string | null;
  final_output_asset_id?: string | null;
};

function getNextAction(progress: {
  totalItems: number;
  completedItems: number;
  totalScenes: number;
  queuedScenes: number;
  processingScenes: number;
  completedScenes: number;
  failedScenes: number;
}) {
  if (progress.totalItems > 0 && progress.completedItems === progress.totalItems) {
    return { action: "publish", label: "Publish campaign" };
  }

  if (
    progress.processingScenes > 0 ||
    progress.queuedScenes > 0 ||
    progress.completedScenes > 0 ||
    progress.failedScenes > 0
  ) {
    return { action: "check_progress", label: "Check progress" };
  }

  if (progress.totalScenes > 0) {
    return { action: "create_videos", label: "Create videos" };
  }

  return { action: "build_scenes", label: "Build scenes" };
}

export default function CampaignDetailClient({
  campaign,
  items,
  progress,
}: {
  campaign: CampaignRow;
  items: CampaignItemRow[];
  progress: {
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    totalScenes: number;
    queuedScenes: number;
    processingScenes: number;
    completedScenes: number;
    failedScenes: number;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextAction = useMemo(() => getNextAction(progress), [progress]);

  async function runAction(key: string, url: string) {
    try {
      setBusy(key);
      setError(null);

      const res = await fetch(url, { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error ?? "Action failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <GlassCard title="Campaign Workspace" strong>
        <div className="flex flex-wrap gap-3">

          {nextAction.action === "build_scenes" && (
            <GlassButton
              onClick={() =>
                runAction("generate", `/api/shopreel/campaigns/${campaign.id}/generate`)
              }
            >
              Build scenes
            </GlassButton>
          )}

          {nextAction.action === "create_videos" && (
            <GlassButton
              onClick={() =>
                runAction("run", `/api/shopreel/campaigns/${campaign.id}/run-all-jobs`)
              }
            >
              Generate videos
            </GlassButton>
          )}

          {nextAction.action === "check_progress" && (
            <GlassButton
              onClick={() =>
                runAction("sync", `/api/shopreel/campaigns/${campaign.id}/sync-processing`)
              }
            >
              Check progress
            </GlassButton>
          )}

          {nextAction.action === "publish" && (
            <Link href={`/shopreel/publish-center?campaign=${campaign.id}`}>
              <GlassButton>Publish</GlassButton>
            </Link>
          )}

        </div>

        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
      </GlassCard>

      <GlassCard title="Progress" strong>
        <div className="text-white text-lg">
          {progress.completedItems} / {progress.totalItems} complete
        </div>
      </GlassCard>

      <GlassCard title="Campaign Videos" strong>
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-white/10 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <div className="text-white font-semibold">{item.title}</div>
                <div className="text-white/60 text-sm">{item.angle}</div>
              </div>

              <div className="flex gap-2 items-center">
                <GlassBadge tone={item.final_output_asset_id ? "copper" : "default"}>
                  {item.final_output_asset_id ? "Ready" : formatShopReelStatus(item.status)}
                </GlassBadge>

                <Link href={`/shopreel/campaigns/items/${item.id}`}>
                  <GlassButton variant="ghost">
                    Open
                  </GlassButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
