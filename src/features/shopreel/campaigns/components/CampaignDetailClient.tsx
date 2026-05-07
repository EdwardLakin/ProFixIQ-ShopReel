"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const [campaignBrain, setCampaignBrain] = useState({ campaignObjective: "", targetAudience: "", channelPriorities: "", contentPillars: "" });
  const [agentRuns, setAgentRuns] = useState<Array<{ id: string; agent_type: string; status: string; confidence: number | null; requires_approval: boolean; updated_at: string }>>([]);

  const nextAction = useMemo(() => getNextAction(progress), [progress]);

  useEffect(() => {
    void (async () => {
      const [brainRes, runsRes] = await Promise.all([
        fetch(`/api/shopreel/campaigns/${campaign.id}/brain`, { cache: "no-store" }),
        fetch(`/api/shopreel/agents/runs?campaignId=${campaign.id}`, { cache: "no-store" }),
      ]);
      const brainJson = (await brainRes.json().catch(() => ({}))) as { campaignBrain?: { campaign_objective?: string | null; target_audience?: string | null; channel_priorities?: string[]; content_pillars?: string[] } | null };
      const runsJson = (await runsRes.json().catch(() => ({}))) as { runs?: Array<{ id: string; agent_type: string; status: string; confidence: number | null; requires_approval: boolean; updated_at: string }> };
      if (brainJson.campaignBrain) setCampaignBrain({ campaignObjective: brainJson.campaignBrain.campaign_objective ?? "", targetAudience: brainJson.campaignBrain.target_audience ?? "", channelPriorities: (brainJson.campaignBrain.channel_priorities ?? []).join("\n"), contentPillars: (brainJson.campaignBrain.content_pillars ?? []).join("\n") });
      setAgentRuns(runsJson.runs ?? []);
    })();
  }, [campaign.id]);

  async function runAction(key: string, url: string) {
    try {
      setBusy(key);
      setError(null);

      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: key === "plan" ? JSON.stringify({ campaignId: campaign.id, agentType: "content_strategist" }) : undefined });
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
        <div className="mt-4 space-y-2">
          <div className="text-xs text-white/60">Campaign Brain (planning memory)</div>
          <textarea className="w-full rounded-xl bg-black/30 border border-white/15 p-2 text-sm" placeholder="Campaign objective" value={campaignBrain.campaignObjective} onChange={(e)=>setCampaignBrain((prev)=>({...prev,campaignObjective:e.target.value}))} />
          <textarea className="w-full rounded-xl bg-black/30 border border-white/15 p-2 text-sm" placeholder="Target audience" value={campaignBrain.targetAudience} onChange={(e)=>setCampaignBrain((prev)=>({...prev,targetAudience:e.target.value}))} />
          <GlassButton variant="secondary" onClick={()=>void fetch(`/api/shopreel/campaigns/${campaign.id}/brain`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignObjective:campaignBrain.campaignObjective,targetAudience:campaignBrain.targetAudience,channelPriorities:campaignBrain.channelPriorities.split("\n").map((x)=>x.trim()).filter(Boolean),contentPillars:campaignBrain.contentPillars.split("\n").map((x)=>x.trim()).filter(Boolean)})})}>Save Campaign Brain</GlassButton>
        </div>
      </GlassCard>


      <GlassCard title="AI Planning" strong>
        <div className="flex items-center gap-2">
          <GlassButton variant="secondary" onClick={() => runAction("plan", `/api/shopreel/agents/plan`)}>{busy === "plan" ? "Generating…" : "Generate planning draft"}</GlassButton>
          <span className="text-xs text-white/60">Read-only plans. Approval required before any execution.</span>
        </div>
        <div className="mt-3 grid gap-2">
          {agentRuns.length === 0 ? <div className="text-sm text-white/60">No planning runs yet.</div> : agentRuns.slice(0, 6).map((run) => (
            <div key={run.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/80">
              <div className="font-medium text-white">{run.agent_type}</div>
              <div>Status: {run.status} · Confidence: {run.confidence ?? "n/a"}</div>
              <div>Requires approval: {run.requires_approval ? "Yes" : "No"}</div>
            </div>
          ))}
        </div>
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
