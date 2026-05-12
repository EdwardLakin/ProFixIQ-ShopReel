"use client";

import Link from "next/link";
import { useMemo } from "react";
import { operatorSurfaceRegistry, resolveRuntimeFallbackRoute } from "@/features/shopreel/ui/system/operatorSurfaceRegistry";
import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

type RuntimeRecentItem = { id: string; title: string; status: string };

export default function OperatorRuntimeCanvas({
  session,
  onRecover,
  onInterruptManual,
  onRunCommand,
  context,
  recent,
}: {
  session: OperatorRuntimeSessionState;
  onRecover: () => void;
  onInterruptManual: () => void;
  onRunCommand: (command: string) => void;
  context: WorkspaceMemory | null;
  recent: RuntimeRecentItem[];
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

  const continuityNotices = [
    context?.continuityThreads?.[0] ? `Continuing from ${context.continuityThreads[0].label.toLowerCase()}.` : null,
    context?.creativeContinuity?.tonePreference ? `Recent approval changed tone bias toward ${context.creativeContinuity.tonePreference.replaceAll("_", " ")}.` : null,
    context?.creativeContinuity?.pacingPreference ? `Using preferred pacing profile: ${context.creativeContinuity.pacingPreference.replaceAll("_", " ")}.` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="relative rounded-[1.8rem] border border-cyan-200/25 bg-[#071023]/80 p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Active workflow region</div>
          <h2 className="text-xl font-semibold text-white">{activeSurface.label}</h2>
        </div>
        <span className="rounded-full border border-cyan-100/25 px-2 py-1 text-xs text-cyan-100">{session.runtimeState}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {progression.map((step, index) => <span key={step.id} className={`rounded-full px-2 py-1 text-[11px] ${activeProgressIndex >= index && activeProgressIndex !== -1 ? "bg-cyan-400/20 text-cyan-100" : "bg-white/5 text-white/55"}`}>{step.label}</span>)}
      </div>

      {isThinking ? <div className="mt-3 rounded-xl border border-violet-200/30 bg-violet-400/10 px-3 py-2 text-xs text-violet-100">Operator is interpreting and preparing the next surface. {transitionCopy}</div> : null}

      <div className="mt-4 grid gap-3">
        {previousSurface ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">Previous: {previousSurface.label}</div> : null}
        <div className="transition-all duration-300 motion-reduce:transition-none">
          {session.activeSurface === "campaign_planning" ? (
            <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.15em] text-cyan-100/70">Inline campaign planning</div>
              <p className="mt-2 text-sm text-white/80">Interpreted intent: {session.activeCommand || "No campaign intent entered yet."}</p>
              <p className="mt-1 text-sm text-white/70">Objective: launch campaign with operator-managed continuity and fast review handoff.</p>
              <p className="mt-1 text-sm text-white/70">Target channel: {context?.creativeContinuity?.platformBias?.replaceAll("_", " ") ?? "Not selected"}</p>
              <div className="mt-3 flex flex-wrap gap-2">{continuityNotices.map((notice) => <span key={notice} className="rounded-full border border-cyan-100/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-100">{notice}</span>)}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => onRunCommand(`${session.activeCommand} refined with stronger hook and founder tone`)} className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85">Refine intent</button>
                <button onClick={() => onRunCommand("continue active campaign workspace") } className="rounded-xl border border-cyan-200/35 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">Continue existing campaign</button>
                <button onClick={() => onRunCommand("approve and start campaign draft") } className="rounded-xl bg-gradient-to-r from-violet-500/90 to-cyan-400/85 px-3 py-2 text-sm font-semibold text-white">Approve + start</button>
              </div>
            </article>
          ) : session.activeSurface === "campaign_workspace" ? (
            <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.15em] text-cyan-100/70">Campaign continuity workspace</div>
              <p className="mt-2 text-sm text-white/80">Surface morphed from planning into refinement while command context stays active.</p>
              <div className="mt-3 grid gap-2 text-sm text-white/75">{continuityNotices.map((notice) => <p key={notice}>• {notice}</p>)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => onRunCommand("refine campaign tone for approval") } className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/85">Refine tone</button>
                <button onClick={() => onRunCommand("send this to review approvals") } className="rounded-xl border border-cyan-200/35 px-3 py-2 text-sm text-cyan-100">Send to inline review</button>
              </div>
            </article>
          ) : session.activeSurface === "review_inbox" ? (
            <article className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.15em] text-cyan-100/70">Inline review handoff</div>
              <p className="mt-2 text-sm text-white/75">Operator explanation: this needs approval because it changes campaign voice and publish readiness.</p>
              <div className="mt-3 grid gap-2">
                {pendingApprovals.length === 0 ? <p className="text-sm text-white/60">No pending review cards currently. You can still open full review workspace.</p> : pendingApprovals.slice(0, 3).map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-sm font-medium text-white">{item.title}</p><p className="text-xs text-white/65">Status: {item.status}</p><div className="mt-2 flex gap-2"><button onClick={() => onRunCommand(`approve ${item.title}`)} className="rounded-lg border border-cyan-200/35 px-2 py-1 text-xs text-cyan-100">Approve</button><button onClick={() => onRunCommand(`refine ${item.title} tone`)} className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/80">Refine</button><button onClick={() => onRunCommand(`reject ${item.title}`)} className="rounded-lg border border-rose-200/35 px-2 py-1 text-xs text-rose-100">Reject</button></div></div>)}
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
        <button onClick={onInterruptManual} className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">Open manual tools</button>
        <button onClick={onRecover} disabled={!session.recoverableContext} className="rounded-xl border border-cyan-200/35 px-3 py-2 text-sm text-cyan-100 disabled:opacity-50">Resume where we were</button>
        <Link href={fallbackRoute} className="rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-sm text-white/85">Open full workspace</Link>
      </div>
    </section>
  );
}
