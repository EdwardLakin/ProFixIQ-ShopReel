"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
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
type ApprovalTask = { id: string; status: string; title: string; details: string | null; confidence: number | null; requires_approval: boolean };

export default function CampaignDetailClient({ campaign, items, progress, adaptiveMemory }: { campaign: CampaignRow; items: CampaignItemRow[]; progress: { totalItems: number; completedItems: number; progressPercent: number; totalScenes: number; queuedScenes: number; processingScenes: number; completedScenes: number; failedScenes: number }; adaptiveMemory: AdaptiveMemory }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campaignBrain, setCampaignBrain] = useState({ campaignObjective: "", targetAudience: "", channelPriorities: "", contentPillars: "" });
  const [runTasks, setRunTasks] = useState<Record<string, ApprovalTask[]>>({});
  const [taskReason, setTaskReason] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const [brainRes, runsRes] = await Promise.all([
        fetch(`/api/shopreel/campaigns/${campaign.id}/brain`, { cache: "no-store" }),
        fetch(`/api/shopreel/agents/runs?campaignId=${campaign.id}`, { cache: "no-store" }),
      ]);
      const brainJson = (await brainRes.json().catch(() => ({}))) as { campaignBrain?: { campaign_objective?: string | null; target_audience?: string | null; channel_priorities?: string[]; content_pillars?: string[] } | null };
      const runsJson = (await runsRes.json().catch(() => ({}))) as { runs?: Array<{ id: string }> };
      if (brainJson.campaignBrain) setCampaignBrain({ campaignObjective: brainJson.campaignBrain.campaign_objective ?? "", targetAudience: brainJson.campaignBrain.target_audience ?? "", channelPriorities: (brainJson.campaignBrain.channel_priorities ?? []).join("\n"), contentPillars: (brainJson.campaignBrain.content_pillars ?? []).join("\n") });
      const runs = runsJson.runs ?? [];
      const taskEntries = await Promise.all(runs.slice(0, 6).map(async (run) => {
        const runRes = await fetch(`/api/shopreel/agents/runs/${run.id}`, { cache: "no-store" });
        const runJson = (await runRes.json().catch(() => ({}))) as { tasks?: ApprovalTask[] };
        return [run.id, runJson.tasks ?? []] as const;
      }));
      setRunTasks(Object.fromEntries(taskEntries));
    })();
  }, [campaign.id]);

  const pendingTasks = useMemo(() => Object.values(runTasks).flat().filter((task) => task.status === "proposed" && task.requires_approval), [runTasks]);
  const leadTask = pendingTasks[0] ?? null;

  async function transitionTask(taskId: string, action: "approve" | "reject") { /* unchanged */
    try {
      setBusy(`${action}-${taskId}`); setError(null);
      const reason = taskReason[taskId]?.trim() ?? "";
      const res = await fetch(`/api/shopreel/agents/tasks/${taskId}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reason || null, metadata: { source: "campaign_workspace_decision_panel", decisionMode: action === "approve" ? "approve" : reason ? "refine" : "reject", refinementSignal: action === "reject" ? reason || null : null } }) });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; task?: { status: string } };
      if (!res.ok || json?.ok === false || !json.task) throw new Error(json?.error ?? `Failed to ${action} task`);
      setRunTasks((prev) => Object.fromEntries(Object.entries(prev).map(([runId, tasks]) => [runId, tasks.map((task) => task.id === taskId ? { ...task, status: json.task!.status } : task)])));
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Task transition failed"); } finally { setBusy(null); }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-[2.25rem] border border-cyan-200/20 bg-slate-950/45 p-6 shadow-[0_45px_120px_rgba(8,145,178,0.24)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.22),transparent_56%),radial-gradient(circle_at_10%_95%,rgba(6,182,212,0.12),transparent_42%)]" />
      <div className="relative space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-100/70">Execution stage</p>
            <h2 className="text-2xl font-semibold text-white">{leadTask ? leadTask.title : "Campaign chamber stable"}</h2>
            <p className="mt-1 text-sm text-cyan-100/70">{leadTask?.details ?? "Operator and AI are synchronized. Use the control plane to keep campaign momentum."}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <GlassBadge tone="default">{pendingTasks.length} approvals</GlassBadge><GlassBadge tone="muted">{progress.completedItems}/{progress.totalItems} outputs</GlassBadge><GlassBadge tone="muted">{progress.processingScenes + progress.queuedScenes} scenes active</GlassBadge>
          </div>
        </header>

        <div className="rounded-3xl border border-white/15 bg-black/35 p-5 backdrop-blur-md">
          <div className="flex flex-wrap gap-3">
            {leadTask ? <><GlassButton onClick={() => void transitionTask(leadTask.id, "approve")} disabled={busy === `approve-${leadTask.id}`}>Approve and advance</GlassButton><GlassButton variant="ghost" onClick={() => void transitionTask(leadTask.id, "reject")} disabled={busy === `reject-${leadTask.id}`}>Refine trajectory</GlassButton></> : <p className="text-sm text-white/70">No blocking decisions right now.</p>}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/55 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/75">Recessed approval lane</p>
            {pendingTasks.length === 0 ? <div className="text-sm text-white/65">Approval lane is clear.</div> : pendingTasks.slice(0, 4).map((task) => <article key={task.id} className="rounded-2xl bg-black/35 p-3 ring-1 ring-white/10"><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-white">{task.title}</span><GlassBadge tone="muted">Confidence {task.confidence ?? "n/a"}</GlassBadge></div>{task.details ? <p className="mt-1 text-sm text-white/70">{task.details}</p> : null}<textarea value={taskReason[task.id] ?? ""} onChange={(e) => setTaskReason((prev) => ({ ...prev, [task.id]: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 p-2 text-sm" placeholder="Refinement note" /><div className="mt-2 flex gap-2"><GlassButton variant="secondary" onClick={() => void transitionTask(task.id, "approve")}>Approve</GlassButton><GlassButton variant="ghost" onClick={() => void transitionTask(task.id, "reject")}>Refine</GlassButton></div></article>)}
          </div>
          <aside className="space-y-3 rounded-3xl border border-cyan-100/15 bg-cyan-950/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/75">Chamber intelligence</p>
            {adaptiveMemory.learnedNotices.map((notice) => <p key={notice} className="text-sm text-cyan-50/80">{notice}</p>)}
            {adaptiveMemory.tasteSummary.length > 0 ? <div className="flex flex-wrap gap-2">{adaptiveMemory.tasteSummary.map((signal) => <GlassBadge key={signal} tone="muted">{signal}</GlassBadge>)}</div> : <p className="text-sm text-cyan-100/55">No recent taste signals learned.</p>}
            {adaptiveMemory.continuityNotice ? <p className="text-xs text-cyan-100/75">{adaptiveMemory.continuityNotice}</p> : null}
          </aside>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-cyan-100/70">Output constellations</p>
          <div className="space-y-2">
            {items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-black/30 p-3"><div><div className="font-semibold text-white">{item.title}</div><div className="text-sm text-white/60">{item.angle}</div></div><div className="flex items-center gap-2"><GlassBadge tone={item.final_output_asset_id ? "copper" : "default"}>{item.final_output_asset_id ? "Ready" : formatShopReelStatus(item.status)}</GlassBadge><Link href={`/shopreel/campaigns/items/${item.id}?from=workspace`}><GlassButton variant="ghost">Open</GlassButton></Link></div></div>)}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/45 p-4">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-cyan-100/70">Mission memory node</p>
          <textarea className="mb-2 w-full rounded-xl border border-white/10 bg-black/35 p-2 text-sm" placeholder="Campaign objective" value={campaignBrain.campaignObjective} onChange={(e)=>setCampaignBrain((prev)=>({...prev,campaignObjective:e.target.value}))} />
          <textarea className="mb-2 w-full rounded-xl border border-white/10 bg-black/35 p-2 text-sm" placeholder="Target audience" value={campaignBrain.targetAudience} onChange={(e)=>setCampaignBrain((prev)=>({...prev,targetAudience:e.target.value}))} />
          <GlassButton variant="secondary" onClick={()=>void fetch(`/api/shopreel/campaigns/${campaign.id}/brain`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignObjective:campaignBrain.campaignObjective,targetAudience:campaignBrain.targetAudience,channelPriorities:campaignBrain.channelPriorities.split("\n").map((x)=>x.trim()).filter(Boolean),contentPillars:campaignBrain.contentPillars.split("\n").map((x)=>x.trim()).filter(Boolean)})})}>Save mission memory</GlassButton>
          {error ? <div className="mt-2 text-sm text-red-400">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
