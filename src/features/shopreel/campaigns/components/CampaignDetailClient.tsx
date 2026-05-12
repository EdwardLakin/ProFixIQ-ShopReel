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

type AdaptiveMemory = { learnedNotices: string[]; tasteSummary: string[]; continuityNotice: string | null };

type ApprovalTask = {
  id: string;
  status: string;
  title: string;
  details: string | null;
  confidence: number | null;
  requires_approval: boolean;
};

export default function CampaignDetailClient({
  campaign,
  items,
  progress,
  adaptiveMemory,
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
  adaptiveMemory: AdaptiveMemory;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campaignBrain, setCampaignBrain] = useState({ campaignObjective: "", targetAudience: "", channelPriorities: "", contentPillars: "" });
  const [agentRuns, setAgentRuns] = useState<Array<{ id: string; agent_type: string; status: string; confidence: number | null; requires_approval: boolean; updated_at: string }>>([]);
  const [runTasks, setRunTasks] = useState<Record<string, ApprovalTask[]>>({});
  const [taskReason, setTaskReason] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const [brainRes, runsRes] = await Promise.all([
        fetch(`/api/shopreel/campaigns/${campaign.id}/brain`, { cache: "no-store" }),
        fetch(`/api/shopreel/agents/runs?campaignId=${campaign.id}`, { cache: "no-store" }),
      ]);
      const brainJson = (await brainRes.json().catch(() => ({}))) as { campaignBrain?: { campaign_objective?: string | null; target_audience?: string | null; channel_priorities?: string[]; content_pillars?: string[] } | null };
      const runsJson = (await runsRes.json().catch(() => ({}))) as { runs?: Array<{ id: string; agent_type: string; status: string; confidence: number | null; requires_approval: boolean; updated_at: string }> };
      if (brainJson.campaignBrain) setCampaignBrain({ campaignObjective: brainJson.campaignBrain.campaign_objective ?? "", targetAudience: brainJson.campaignBrain.target_audience ?? "", channelPriorities: (brainJson.campaignBrain.channel_priorities ?? []).join("\n"), contentPillars: (brainJson.campaignBrain.content_pillars ?? []).join("\n") });
      const runs = runsJson.runs ?? [];
      setAgentRuns(runs);
      const taskEntries = await Promise.all(runs.slice(0, 6).map(async (run) => {
        const runRes = await fetch(`/api/shopreel/agents/runs/${run.id}`, { cache: "no-store" });
        const runJson = (await runRes.json().catch(() => ({}))) as { tasks?: ApprovalTask[] };
        return [run.id, runJson.tasks ?? []] as const;
      }));
      setRunTasks(Object.fromEntries(taskEntries));
    })();
  }, [campaign.id]);


  function detectRefinementSignal(reason: string): string[] {
    const source = reason.toLowerCase();
    const signals: string[] = [];
    if (/(corporate|scripted|stiff|too ai)/.test(source)) signals.push("authenticity");
    if (/(calm|slower|soften|gentle)/.test(source)) signals.push("calmer pacing");
    if (/(more energy|faster|punchier)/.test(source)) signals.push("higher energy");
    if (/(hook|opening|first seconds)/.test(source)) signals.push("stronger hook");
    if (/(formal)/.test(source)) signals.push("less formal");
    if (/(tiktok|reels|shorts)/.test(source)) signals.push("platform alignment");
    return signals;
  }

  const pendingTasks = useMemo(
    () => Object.values(runTasks).flat().filter((task) => task.status === "proposed" && task.requires_approval),
    [runTasks]
  );
  const leadTask = pendingTasks[0] ?? null;

  async function transitionTask(taskId: string, action: "approve" | "reject") {
    try {
      setBusy(`${action}-${taskId}`);
      setError(null);
      const reason = taskReason[taskId]?.trim() ?? "";
      const res = await fetch(`/api/shopreel/agents/tasks/${taskId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason || null,
          metadata: {
            source: "campaign_workspace_decision_panel",
            decisionMode: action === "approve" ? "approve" : reason ? "refine" : "reject",
            refinementSignal: action === "reject" ? reason || null : null,
            refinementTags: action === "reject" ? detectRefinementSignal(reason) : [],
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; task?: { status: string } };
      if (!res.ok || json?.ok === false || !json.task) throw new Error(json?.error ?? `Failed to ${action} task`);
      setRunTasks((prev) => Object.fromEntries(Object.entries(prev).map(([runId, tasks]) => [runId, tasks.map((task) => task.id === taskId ? { ...task, status: json.task!.status } : task)])));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task transition failed");
    } finally {
      setBusy(null);
    }
  }

  async function runAction(key: string, url: string) {
    try {
      setBusy(key);
      setError(null);
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: key === "plan" ? JSON.stringify({ campaignId: campaign.id, agentType: "content_strategist" }) : undefined });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.error ?? "Action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <GlassCard label="Current AI step" title={leadTask ? leadTask.title : "Campaign is moving forward"} description={leadTask?.details ?? "The operator is coordinating planning and execution. Approve decisions below to keep momentum."} strong>
        <div className="flex flex-wrap items-center gap-2">
          <GlassBadge tone="default">{pendingTasks.length} approvals waiting</GlassBadge>
          <GlassBadge tone="muted">{progress.completedItems}/{progress.totalItems} videos ready</GlassBadge>
          <GlassBadge tone="muted">{progress.processingScenes + progress.queuedScenes} scenes in motion</GlassBadge>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {leadTask ? (
            <>
              <GlassButton onClick={() => void transitionTask(leadTask.id, "approve")} disabled={busy === `approve-${leadTask.id}`}>Approve next decision</GlassButton>
              <GlassButton variant="ghost" onClick={() => void transitionTask(leadTask.id, "reject")} disabled={busy === `reject-${leadTask.id}`}>Refine before continuing</GlassButton>
            </>
          ) : (
            <GlassButton onClick={() => void runAction("plan", `/api/shopreel/agents/plan`)}>{busy === "plan" ? "Planning…" : "Ask AI for next plan"}</GlassButton>
          )}
        </div>
      </GlassCard>

      {(adaptiveMemory.learnedNotices.length > 0 || adaptiveMemory.tasteSummary.length > 0) ? <GlassCard label="Adaptive continuity" title="AI learned from your recent direction" description="Preference-aware continuity is applied before each next proposal." strong>
        <div className="grid gap-2">
          {adaptiveMemory.learnedNotices.map((notice) => <p key={notice} className="text-sm text-white/75">{notice}</p>)}
          {adaptiveMemory.tasteSummary.length > 0 ? <div className="flex flex-wrap gap-2">{adaptiveMemory.tasteSummary.map((signal) => <GlassBadge key={signal} tone="muted">{signal}</GlassBadge>)}</div> : null}
          {adaptiveMemory.continuityNotice ? <p className="text-xs text-cyan-100/80">{adaptiveMemory.continuityNotice}</p> : null}
        </div>
      </GlassCard> : null}

      <GlassCard label="Approval panel" title="Decisions that need your direction" description="Approve, reject, or refine AI proposals. These decisions guide the next execution step." strong>
        <div className="grid gap-3">
          {pendingTasks.length === 0 ? <div className="text-sm text-white/70">No blocking approvals right now. You can continue execution or ask AI to draft the next plan.</div> : pendingTasks.slice(0, 5).map((task) => (
            <div key={task.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-white">{task.title}</div>
                <GlassBadge tone="muted">Confidence {task.confidence ?? "n/a"}</GlassBadge>
              </div>
              {task.details ? <div className="mt-2 text-sm text-white/70">{task.details}</div> : null}
              <textarea
                value={taskReason[task.id] ?? ""}
                onChange={(event) => setTaskReason((prev) => ({ ...prev, [task.id]: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-2 text-sm"
                placeholder="Optional refinement note (e.g., less scripted, calmer pacing, stronger TikTok hook)."
              />
              <div className="mt-3 flex gap-2">
                <GlassButton variant="secondary" onClick={() => void transitionTask(task.id, "approve")} disabled={busy === `approve-${task.id}`}>Approve</GlassButton>
                <GlassButton variant="ghost" onClick={() => void transitionTask(task.id, "reject")} disabled={busy === `reject-${task.id}`}>Reject / refine</GlassButton>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard label="Outputs" title="Assets and deliverables" description="Generated campaign videos and item workspaces." strong>
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-white font-semibold">{item.title}</div>
                <div className="text-white/60 text-sm">{item.angle}</div>
              </div>
              <div className="flex gap-2 items-center">
                <GlassBadge tone={item.final_output_asset_id ? "copper" : "default"}>{item.final_output_asset_id ? "Ready" : formatShopReelStatus(item.status)}</GlassBadge>
                <Link href={`/shopreel/campaigns/items/${item.id}?from=workspace`}><GlassButton variant="ghost">Open item</GlassButton></Link>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard label="Campaign memory" title="Intent and continuity" description="Keep campaign intent explicit so the operator can plan better next actions." strong>
        <div className="space-y-2">
          <textarea className="w-full rounded-xl bg-black/30 border border-white/15 p-2 text-sm" placeholder="Campaign objective" value={campaignBrain.campaignObjective} onChange={(e)=>setCampaignBrain((prev)=>({...prev,campaignObjective:e.target.value}))} />
          <textarea className="w-full rounded-xl bg-black/30 border border-white/15 p-2 text-sm" placeholder="Target audience" value={campaignBrain.targetAudience} onChange={(e)=>setCampaignBrain((prev)=>({...prev,targetAudience:e.target.value}))} />
          <GlassButton variant="secondary" onClick={()=>void fetch(`/api/shopreel/campaigns/${campaign.id}/brain`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignObjective:campaignBrain.campaignObjective,targetAudience:campaignBrain.targetAudience,channelPriorities:campaignBrain.channelPriorities.split("\n").map((x)=>x.trim()).filter(Boolean),contentPillars:campaignBrain.contentPillars.split("\n").map((x)=>x.trim()).filter(Boolean)})})}>Save mission memory</GlassButton>
        </div>
        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
      </GlassCard>
    </div>
  );
}
