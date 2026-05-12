"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import ShopReelNotificationsBell from "@/features/shopreel/ui/ShopReelNotificationsBell";
import { AiCommandInput, interpretCommand } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import { readWorkspaceMemory, type WorkspaceMemory, writeWorkspaceMemory, buildPendingTasks, buildContinuityThreads } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { buildOperationalGraph, planCommandExecution } from "@/features/shopreel/ui/system/operationalGraph";
import { executeShopReelCommand } from "@/features/shopreel/ui/system/executeShopReelCommand";
import { resolveOperatorRuntime } from "@/features/shopreel/ui/system/resolveOperatorRuntime";
import OperatorRuntimeCanvas from "@/features/shopreel/ui/system/OperatorRuntimeCanvas";
import {
  buildInterruptAction,
  buildRuntimeStartAction,
  initialOperatorRuntimeSession,
  operatorRuntimeSessionReducer,
} from "@/features/shopreel/ui/system/operatorRuntimeSession";
import { persistRuntimeSession, readPersistedRuntimeSession, type PersistedChamberMemory } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

type RecentItem = { id: string; title: string; status: string };
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

const quickPrompts = ["Launch campaign", "Refine direction", "Review approvals", "Open workspace"];
const chamberNav = [
  { label: "Home", shortLabel: "H", href: "/shopreel" },
  { label: "Workspace", shortLabel: "W", href: "/shopreel/campaigns" },
  { label: "Continuity", shortLabel: "C", href: "/shopreel/operator" },
  { label: "Approvals", shortLabel: "A", href: "/shopreel/review" },
  { label: "Reports", shortLabel: "R", href: "/shopreel/analytics" },
] as const;
const chamberGlyphs = ["◉", "◈", "◎", "◌", "◍"] as const;

export default function HomeCommandClient({ recent }: { recent: RecentItem[] }) {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [context, setContext] = useState<WorkspaceMemory | null>(null);
  const interpreted = useMemo(() => interpretCommand(command), [command]);
  const [runtimeSession, dispatch] = useReducer(operatorRuntimeSessionReducer, initialOperatorRuntimeSession);
  const [campaignContext, setCampaignContext] = useState<RuntimeCampaignContext | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [chamberMemory, setChamberMemory] = useState<PersistedChamberMemory | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const parsed = readWorkspaceMemory();
    if (!parsed) return;
    setContext(parsed);
    setCommand(parsed.lastCommand);
    const persistedRuntime = readPersistedRuntimeSession();
    if (persistedRuntime) {
      setChamberMemory(persistedRuntime.chamberMemory);
      dispatch({ type: "START_RUNTIME", command: parsed.lastCommand ?? "", resolution: {
        state: persistedRuntime.progressionStage,
        surfaceId: persistedRuntime.activeSurface,
        transitionMode: "restore_previous",
        confidence: "high",
        summary: "Restored runtime continuity from last workspace.",
        recommendedRouteFallback: persistedRuntime.returnTarget,
        contextCarryover: { rawCommand: parsed.lastCommand ?? "", interpretedIntent: "unknown", selectedCampaignId: persistedRuntime.activeCampaignId, hasPendingApprovals: recent.some((item) => /review|approval|needs/i.test(item.status)), hasActiveCampaign: recent.length > 0, hasAssetsContext: Boolean(parsed.creativeContinuity) },
      }});
    }

  }, [recent]);

  const persistContext = (route: string) => {
    const pendingTasks = buildPendingTasks(interpreted.intent);
    const operationalGraph = buildOperationalGraph({ generationId: recent[0]?.id, campaignId: context?.lastCampaignId, pendingTaskCount: pendingTasks.filter((task) => !task.done).length, blockerCount: pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length, readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length, interrupted: false, continuityThreadCount: 0, lastRoute: route });
    const base = context ?? readWorkspaceMemory();
    if (!base) return;
    const next: WorkspaceMemory = { ...base, lastWorkflow: interpreted.intent, lastCommand: command, lastRoute: route, pendingTasks, continuityThreads: buildContinuityThreads({ intent: interpreted.intent, pendingTasks, lastRoute: route }), operationalGraph, lastExecutionPlan: planCommandExecution(command, operationalGraph, route, interpreted.intent), updatedAt: new Date().toISOString() };
    writeWorkspaceMemory(next);
    setContext(next);
  };

  useEffect(() => {
    persistRuntimeSession(runtimeSession);
    const persistedRuntime = readPersistedRuntimeSession();
    setChamberMemory(persistedRuntime?.chamberMemory ?? null);
  }, [runtimeSession]);

  useEffect(() => {
    const campaignId = runtimeSession.selectedEntityIds.campaignId;
    if (!campaignId) {
      setCampaignContext(null);
      return;
    }
    void fetch(`/api/shopreel/campaigns/${campaignId}/runtime-context`, { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setCampaignContext(json?.campaign ?? null))
      .catch(() => setCampaignContext(null));
  }, [runtimeSession.selectedEntityIds.campaignId]);

  const runCommand = (overrideCommand?: string) => {
    const nextCommand = overrideCommand ?? command;
    const execution = executeShopReelCommand({ command: nextCommand, lastRoute: context?.lastRoute, source: "home_command" });
    const runtime = resolveOperatorRuntime({ rawCommand: nextCommand, classifiedIntent: execution.commandIntent, currentPath: context?.lastRoute ?? "/shopreel", selectedCampaignId: context?.lastCampaignId ?? null, hasPendingApprovals: recent.some((item) => /review|approval|needs/i.test(item.status)), hasActiveCampaign: recent.length > 0, hasAssetsContext: Boolean(context?.creativeContinuity) });
    dispatch(buildRuntimeStartAction(runtime, nextCommand));
    persistContext(execution.selectedRoute);
    if (overrideCommand) setCommand(overrideCommand);
  };

  const statusTone = (status: string) => {
    if (/await|review|needs/i.test(status)) return "Awaiting Review";
    if (/interrupt|pause|block/i.test(status)) return "Interrupted";
    if (/restore|recover|resume/i.test(status)) return "Restored";
    if (/active|running|draft|plan|build/i.test(status)) return "Active";
    return "Stable";
  };

  return (
    <div className="relative h-[calc(100svh-8.25rem)] max-h-[960px] min-h-[700px] overflow-hidden rounded-[2.1rem] bg-[radial-gradient(130%_95%_at_58%_-8%,rgba(85,67,182,.42),transparent_56%),radial-gradient(90%_80%_at_3%_95%,rgba(21,166,224,.2),transparent_68%),linear-gradient(145deg,#04070f,#070c1c_38%,#090b1a)] p-2.5 md:p-3">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(6,11,32,.92),rgba(6,9,25,.74)_35%,rgba(15,13,32,.72)_66%,rgba(15,10,24,.92))]" />
      <div className="grid h-full min-h-0 gap-2.5 lg:grid-cols-[80px_minmax(0,1fr)_340px]">
        <aside className="hidden min-h-0 flex-col rounded-[1.4rem] bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-2 shadow-[inset_-1px_0_0_rgba(255,255,255,.06)] lg:flex">
          <div className="space-y-2">
            {chamberNav.map((item, index) => (
              <Link key={item.href} href={item.href} title={item.label} className="group flex items-center justify-center rounded-xl px-1.5 py-2 text-xs text-white/72 transition hover:bg-violet-500/12 hover:text-cyan-50">
                <span className="text-[13px] text-cyan-200/70 group-hover:text-cyan-100">{chamberGlyphs[index]}</span>
                <span className="text-[10px] text-white/45">{item.shortLabel}</span>
              </Link>
            ))}
          </div>
          <Link href="/shopreel/operations" className="mt-auto rounded-xl bg-gradient-to-r from-amber-300/12 to-violet-400/12 px-1.5 py-2 text-center text-[10px] font-medium tracking-[0.08em] text-amber-100/90">OPS</Link>
        </aside>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2.5">
          <section className="relative min-h-0 overflow-hidden rounded-[1.8rem] bg-[linear-gradient(140deg,rgba(9,14,33,.9),rgba(4,8,21,.92)_48%,rgba(12,11,25,.92))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_18px_48px_rgba(1,3,10,.5)]">
            <div className="pointer-events-none absolute right-[2.2rem] top-[6.4rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,.35),rgba(124,58,237,.28)_45%,transparent_72%)]" />
            <div className={`${prefersReducedMotion ? "" : "animate-[spin_26s_linear_infinite]"} pointer-events-none absolute right-[3.2rem] top-[7.1rem] h-20 w-20 rounded-full border border-cyan-100/25`} />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/70">Ready for next move</div>
                <p className="mt-1 text-sm text-white/75">Continuity intact. Systems nominal.</p>
              </div>
              <ShopReelNotificationsBell />
            </div>
            <div className="relative mt-3 rounded-[1.15rem] bg-[linear-gradient(145deg,rgba(14,21,44,.68),rgba(8,12,30,.82))] p-3 shadow-[inset_0_0_0_1px_rgba(139,92,246,.16),inset_0_12px_40px_rgba(34,211,238,.08)]">
              <div className="mb-2 text-xs text-cyan-100/75">Operator prompt</div>
              <AiCommandInput value={command} onChange={setCommand} placeholder="What should the operator run next?" className="min-h-16 border-transparent bg-transparent shadow-none focus-visible:ring-0" />
              <div className="mt-2 flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => setCommand(prompt)} className="rounded-full bg-white/[0.08] px-3 py-1 text-xs text-white/82">{prompt}</button>)}</div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => runCommand()} className="rounded-xl bg-gradient-to-r from-violet-500/90 to-cyan-400/85 px-4 py-2 text-sm font-semibold text-white">Continue</button>
              <Link href="/shopreel/review" className="rounded-xl border border-white/18 px-3 py-2 text-sm text-white/80">Review approvals</Link>
              <button onClick={() => dispatch({ type: "RECOVER" })} disabled={!runtimeSession.recoverableContext} className="rounded-lg border border-cyan-200/30 bg-cyan-400/10 px-2.5 py-1.5 text-xs text-cyan-100/90 disabled:opacity-50">Resume</button>
              <Link href="/shopreel/operations" className="ml-auto text-xs text-cyan-100/80 underline-offset-2 hover:underline">Manual / Operations</Link>
            </div>
            <OperatorRuntimeCanvas
              session={runtimeSession}
              onRecover={() => dispatch({ type: "RECOVER" })}
              onInterruptManual={() => dispatch(buildInterruptAction({ reason: "Manual tools requested", requestedSurface: "manual_operations", returnSurface: runtimeSession.activeSurface, returnState: runtimeSession.runtimeState, fallbackRoute: "/shopreel/operations" }))}
              onRunCommand={(next) => runCommand(next)}
              context={context}
              recent={recent}
              campaignContext={campaignContext}
              onDecisionSaved={(summary) => dispatch({ type: "APPLY_REVIEW_DECISION", decisionSummary: summary, nextState: "refining_output" })}
              reducedMotion={prefersReducedMotion}
              chamberMemory={chamberMemory}
            />
          </section>

          <section className="grid grid-cols-5 gap-2 rounded-xl bg-[linear-gradient(145deg,rgba(10,14,31,.52),rgba(7,12,30,.72))] px-2.5 py-2 text-xs">
            {[
              ["Runtime pulse", "Calm"],
              ["Continuity signal", "Stable"],
              ["Atmosphere", "Focused"],
              ["Momentum", "Building"],
              ["Unresolved", `${recent.filter((item) => /needs|review|block|interrupt/i.test(item.status)).length} items`],
            ].map(([label, value]) => (
              <div key={label} className="border-l border-white/10 px-2 py-1 first:border-l-0">
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/55">{label}</div>
                <div className="mt-0.5 text-sm text-cyan-100">{value}</div>
              </div>
            ))}
          </section>

        </div>

        <aside className="min-h-0 h-full max-h-full overflow-hidden rounded-2xl bg-[linear-gradient(150deg,rgba(10,14,32,.74),rgba(8,11,27,.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Operational Worlds</h3>
            <span className="text-[11px] text-white/55">Recent continuity</span>
          </div>
          <div className="h-[calc(100%-2rem)] min-h-0 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(103,232,249,.35)_transparent] [scrollbar-width:thin]">
            <div className="grid gap-2.5">
            {recent.slice(0, 12).map((item) => (
              <button key={item.id} onClick={() => router.push(`/shopreel/content/${item.id}`)} className="relative block min-h-[192px] w-full overflow-hidden rounded-2xl bg-[radial-gradient(88%_60%_at_84%_14%,rgba(251,146,60,.3),transparent_58%),radial-gradient(120%_90%_at_60%_100%,rgba(99,102,241,.28),rgba(5,8,22,.92)_70%)] p-3.5 text-left shadow-[0_16px_45px_rgba(0,0,0,.42)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,10,26,.9)_74%)]" />
                <div className="pointer-events-none absolute -right-8 top-8 h-24 w-24 rounded-full bg-amber-200/20 blur-2xl" />
                <div className="pointer-events-none absolute left-0 top-[42%] h-px w-full bg-gradient-to-r from-transparent via-cyan-100/30 to-transparent" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/70">{statusTone(item.status)}</span>
                  <span className="text-[10px] text-white/45">{item.id.slice(0, 8)}</span>
                </div>
                <p className="relative mt-2 line-clamp-2 text-sm text-white">{item.title}</p>
                <div className="relative mt-6 text-xs text-white/70">Stage: {item.status.replaceAll("_", " ")}</div>
                <div className="relative text-xs text-cyan-100/80">Continue where you left off</div>
              </button>
            ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
