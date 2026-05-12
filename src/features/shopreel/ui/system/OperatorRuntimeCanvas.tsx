"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { deriveRuntimeChoreography } from "@/features/shopreel/ui/system/runtimeChoreography";
import { operatorSurfaceRegistry, resolveRuntimeFallbackRoute } from "@/features/shopreel/ui/system/operatorSurfaceRegistry";
import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { approveRuntimeReviewDecision, rejectRuntimeReviewDecision, requestRuntimeReviewChanges, type RuntimeReviewActionError } from "@/features/shopreel/ui/system/operatorRuntimeReviewActions";

type RuntimeRecentItem = { id: string; title: string; status: string };
type RuntimeCampaignContext = {
  id: string;
  title: string;
  status: string;
  channels: string[];
  updated_at: string;
  reviewStatus: string;
  refinementHistory: Array<{ action: string; reason: string | null; createdAt: string }>;
  continuity: { lastDecisionAt: string; lastUpdatedAt: string };
};

export default function OperatorRuntimeCanvas({
  session,
  onRecover,
  onInterruptManual,
  onRunCommand,
  context,
  recent,
  campaignContext,
  onDecisionSaved,
  reducedMotion,
}: {
  session: OperatorRuntimeSessionState;
  onRecover: () => void;
  onInterruptManual: () => void;
  onRunCommand: (command: string) => void;
  context: WorkspaceMemory | null;
  recent: RuntimeRecentItem[];
  campaignContext: RuntimeCampaignContext | null;
  onDecisionSaved: (summary: string) => void;
  reducedMotion: boolean;
}) {
  const activeSurface = operatorSurfaceRegistry[session.activeSurface];
  const previousSurface = session.previousSurface ? operatorSurfaceRegistry[session.previousSurface] : null;
  const isThinking = session.pendingTransition !== null;
  const fallbackRoute = resolveRuntimeFallbackRoute(session.activeSurface, session.fallbackRoute);

  const transitionCopy = useMemo(() => {
    if (!session.pendingTransition) return "";
    return `Transition mode: ${session.pendingTransition.replaceAll("_", " ")}`;
  }, [session.pendingTransition]);

  const progression: { id: string; label: string }[] = [
    { id: "planning_campaign", label: "Planning" },
    { id: "generating_draft", label: "Drafting" },
    { id: "refining_output", label: "Refining" },
    { id: "awaiting_approval", label: "Awaiting approval" },
    { id: "assembling_package", label: "Packaging" },
    { id: "completed_export_ready", label: "Ready" },
  ];
  const activeProgressIndex = progression.findIndex((step) => step.id === session.runtimeState);
  const pendingApprovals = recent.filter((item) => /review|approval|needs/i.test(item.status));
  const refinementDepth = campaignContext?.refinementHistory.length ?? 0;
  const choreography = deriveRuntimeChoreography({
    session,
    memory: context,
    pendingApprovals: pendingApprovals.length,
    refinementDepth,
    campaignUnavailable: Boolean(session.selectedEntityIds.campaignId && !campaignContext),
    reducedMotion,
  });

  const [decisionState, setDecisionState] = useState<Record<string, { status: "idle" | "pending" | "success" | "error"; message?: string }>>({});

  async function mutateInlineDecision(item: RuntimeRecentItem, action: "approve" | "reject" | "refine"): Promise<void> {
    setDecisionState((prev) => ({ ...prev, [item.id]: { status: "pending" } }));
    try {
      const reason = action === "refine" ? "Request changes from runtime inline review." : null;
      if (action === "approve") await approveRuntimeReviewDecision({ taskId: item.id, reason });
      if (action === "reject") await rejectRuntimeReviewDecision({ taskId: item.id, reason: "Rejected from runtime inline review." });
      if (action === "refine") await requestRuntimeReviewChanges({ taskId: item.id, reason });
      setDecisionState((prev) => ({ ...prev, [item.id]: { status: "success", message: "Decision saved. ShopReel will carry that feedback into the next step." } }));
      onDecisionSaved("Decision saved. ShopReel will carry that feedback into the next step.");
    } catch (error) {
      const normalized = error as RuntimeReviewActionError;
      setDecisionState((prev) => ({ ...prev, [item.id]: { status: "error", message: normalized.message ?? "Decision failed." } }));
    }
  }

  const continuityNotices = [
    context?.continuityThreads?.[0] ? `Continuing from ${context.continuityThreads[0].label.toLowerCase()}.` : null,
    context?.creativeContinuity?.tonePreference ? `Recent approval changed tone bias toward ${context.creativeContinuity.tonePreference.replaceAll("_", " ")}.` : null,
    context?.creativeContinuity?.pacingPreference ? `Using preferred pacing profile: ${context.creativeContinuity.pacingPreference.replaceAll("_", " ")}.` : null,
  ].filter(Boolean) as string[];
  const progressionAhead = progression.slice(Math.max(activeProgressIndex + 1, 0), Math.max(activeProgressIndex + 3, 0));

  return (
    <section className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${choreography.depthModel.shellLightingClass} p-4 md:p-6`}>
      <div className={`pointer-events-none absolute inset-0 ${choreography.depthModel.backdropClass}`} />
      <div className="pointer-events-none absolute inset-x-[6%] top-[15%] h-[55%] rounded-[2rem] bg-gradient-to-b from-white/[0.05] via-transparent to-transparent blur-2xl" />
      <div className="relative mb-3 grid gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-cyan-100/90 md:grid-cols-2">
        <div>Operator presence: <span className="text-white/80">{session.lastOperatorSummary}</span></div>
        <div>Active campaign identity: <span className="text-white/80">{campaignContext?.title ?? (session.selectedEntityIds.campaignId ? "Campaign context unavailable" : "No active campaign selected")}</span></div>
        <div>Workflow progression: <span className="text-white/80">{session.runtimeState.replaceAll("_", " ")}</span></div>
        <div>Recent decision trail: <span className="text-white/80">{campaignContext?.refinementHistory?.[0]?.action ?? "No recent inline mutation."}</span></div>
      </div>
      <div className="relative flex items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Active workflow region</div>
          <h2 className="text-xl font-semibold text-white">{activeSurface.label}</h2>
        </div>
        <span className="rounded-full border border-cyan-100/25 px-2 py-1 text-xs text-cyan-100">{session.runtimeState}</span>
      </div>
      <div className={`mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 ${choreography.depthModel.continuityRailClass}`}>
        <div className="mb-2 text-[10px] uppercase tracking-[0.17em] text-cyan-100/60">Continuity memory spine</div>
        <div className="flex flex-wrap gap-2">
          {progression.map((step, index) => <span key={step.id} className={`rounded-full px-2 py-1 text-[11px] ${activeProgressIndex >= index && activeProgressIndex !== -1 ? "bg-cyan-400/20 text-cyan-100" : "bg-white/5 text-white/55"}`}>{step.label}</span>)}
        </div>
      </div>

      {isThinking ? <div className="mt-3 rounded-xl border border-violet-200/30 bg-violet-400/10 px-3 py-2 text-xs text-violet-100">Operator is interpreting and preparing the next surface. {transitionCopy}</div> : null}
      <div className="mt-2 rounded-xl border border-cyan-200/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
        {choreography.message} · transition {choreography.action.replaceAll("_", " ")} · intensity {choreography.intensity}
      </div>
      {choreography.staleState ? (
        <div className="mt-2 rounded-xl border border-amber-200/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {choreography.staleState.detail} <Link href={choreography.staleState.fallbackRoute} className="underline">{choreography.staleState.actionLabel}</Link>
        </div>
      ) : null}

      <div className="relative mt-4 grid gap-3">
        {previousSurface ? <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55 transition-all duration-300 ${choreography.depthModel.previousLayerClass}`}>Previous: {previousSurface.label}</div> : null}
        {progressionAhead.length > 0 ? (
          <div className={`rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-white/60 transition-all duration-300 ${choreography.depthModel.futureLayerClass} ${choreography.depthModel.supportSurfaceClass}`}>
            Next depth cues: {progressionAhead.map((step) => step.label).join(" → ")}
          </div>
        ) : null}
        <div className={`${choreography.motionClass} ${choreography.reducedMotionClass} ${choreography.depthModel.activeLayerClass} relative`}>
          <div className={`pointer-events-none absolute inset-x-8 -top-5 h-16 rounded-full bg-gradient-to-r ${choreography.depthModel.objectiveGlowClass} blur-xl`} />
          {session.activeSurface === "campaign_planning" ? (
            <article className="relative rounded-[1.7rem] border border-cyan-100/20 bg-[linear-gradient(145deg,rgba(14,21,46,.8),rgba(8,12,27,.95))] p-5 shadow-[0_36px_100px_rgba(0,0,0,0.58)] backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Active objective · inline campaign planning</div>
              <p className="mt-2 text-sm text-white/80">Interpreted intent: {session.activeCommand || "No campaign intent entered yet."}</p>
              <p className="mt-1 text-sm text-cyan-50">Objective: launch campaign with operator-managed continuity and fast review handoff.</p>
              <p className="mt-1 text-sm text-white/70">Target channel: {campaignContext?.channels?.join(", ") || context?.creativeContinuity?.platformBias?.replaceAll("_", " ") || "Not selected"}</p>
              {campaignContext ? <p className="mt-1 text-sm text-white/70">Hydrated campaign: {campaignContext.title} · {campaignContext.status} · review {campaignContext.reviewStatus}</p> : null}
              {campaignContext?.refinementHistory?.[0] ? <p className="mt-1 text-xs text-cyan-100/85">Latest refinement: {campaignContext.refinementHistory[0].reason ?? campaignContext.refinementHistory[0].action}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">{continuityNotices.map((notice) => <span key={notice} className="rounded-full border border-cyan-100/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-100">{notice}</span>)}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onRunCommand(`${session.activeCommand} refined with stronger hook and founder tone`)} className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85">Refine intent</button>
                <button onClick={() => onRunCommand("continue active campaign workspace") } className="rounded-xl border border-cyan-200/35 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">Continue existing campaign</button>
                <button onClick={() => onRunCommand("approve and start campaign draft") } className="rounded-xl bg-gradient-to-r from-violet-500/90 to-cyan-400/85 px-3 py-2 text-sm font-semibold text-white">Approve + start</button>
                {campaignContext ? <button onClick={() => void fetch(`/api/shopreel/agents/plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: campaignContext.id, agentType: "content_strategist" }) })} className="rounded-xl border border-emerald-300/35 px-3 py-2 text-sm text-emerald-100">Plan next mutation</button> : null}
              </div>
            </article>
          ) : session.activeSurface === "campaign_workspace" ? (
            <article className="relative rounded-[1.7rem] border border-cyan-100/20 bg-[linear-gradient(145deg,rgba(14,21,46,.8),rgba(8,12,27,.95))] p-5 shadow-[0_36px_100px_rgba(0,0,0,0.58)] backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Active objective · campaign continuity workspace</div>
              <p className="mt-2 text-sm text-white/80">Surface morphed from planning into refinement while command context stays active.</p>
              <div className="mt-3 grid gap-2 text-sm text-white/75">{continuityNotices.map((notice) => <p key={notice}>• {notice}</p>)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => onRunCommand("refine campaign tone for approval") } className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85">Refine tone</button>
                <button onClick={() => onRunCommand("send this to review approvals") } className="rounded-xl border border-cyan-200/35 px-3 py-2 text-sm text-cyan-100">Send to inline review</button>
              </div>
            </article>
          ) : session.activeSurface === "review_inbox" ? (
            <article className="relative rounded-[1.7rem] border border-cyan-100/20 bg-[linear-gradient(145deg,rgba(14,21,46,.8),rgba(8,12,27,.95))] p-5 shadow-[0_36px_100px_rgba(0,0,0,0.58)] backdrop-blur-xl">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Active objective · inline review handoff</div>
              <p className="mt-2 text-sm text-white/75">Operator explanation: this needs approval because it changes campaign voice and publish readiness.</p>
              <div className="mt-3 grid gap-2">
                {pendingApprovals.length === 0 ? <p className="text-sm text-white/60">No pending review cards currently. You can still open full review workspace.</p> : pendingApprovals.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-sm font-medium text-white">{item.title}</p><p className="text-xs text-white/65">Status: {item.status}</p><div className="mt-2 flex gap-2"><button onClick={() => void mutateInlineDecision(item, "approve")} disabled={decisionState[item.id]?.status === "pending"} className="rounded-lg border border-cyan-200/35 px-2 py-1 text-xs text-cyan-100">Approve</button><button onClick={() => void mutateInlineDecision(item, "refine")} disabled={decisionState[item.id]?.status === "pending"} className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/80">Refine</button><button onClick={() => void mutateInlineDecision(item, "reject")} disabled={decisionState[item.id]?.status === "pending"} className="rounded-lg border border-rose-200/35 px-2 py-1 text-xs text-rose-100">Reject</button></div>{decisionState[item.id]?.status === "error" ? <div className="mt-2 text-xs text-rose-200">{decisionState[item.id]?.message} <button onClick={() => void mutateInlineDecision(item, "approve")} className="underline">Retry approve</button></div> : null}{decisionState[item.id]?.status === "success" ? <p className="mt-2 text-xs text-emerald-200">{decisionState[item.id]?.message}</p> : null}</div>)}
              </div>
            </article>
          ) : activeSurface.render()}
        </div>
      </div>

      {session.interruption ? (
        <div className="mt-4 rounded-xl border border-amber-200/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          Interrupted: {session.interruption.reason}. You can recover previous workflow context anytime.
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={onInterruptManual} className="rounded-xl border border-white/15 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10">Manual tools</button>
        <button onClick={onRecover} disabled={!session.recoverableContext} className="rounded-xl border border-cyan-200/35 px-3 py-2 text-sm text-cyan-100 disabled:opacity-50">Resume where we were</button>
        <Link href={fallbackRoute} className="rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-sm text-white/85">Open full workspace</Link>
      </div>
    </section>
  );
}
