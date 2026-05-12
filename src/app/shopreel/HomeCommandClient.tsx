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
  { label: "Home", icon: "⌂", href: "/shopreel" },
  { label: "Workspace", icon: "◫", href: "/shopreel/campaigns" },
  { label: "Continuity", icon: "◌", href: "/shopreel/operator" },
  { label: "Approvals", icon: "✓", href: "/shopreel/review" },
  { label: "Reports", icon: "◴", href: "/shopreel/analytics" },
] as const;

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
    <div className="relative h-[100svh] w-full overflow-hidden bg-[radial-gradient(140%_130%_at_40%_25%,rgba(76,66,199,.36),transparent_60%),radial-gradient(95%_95%_at_85%_85%,rgba(43,148,196,.22),transparent_70%),linear-gradient(150deg,#02050f,#040915_42%,#090b1b)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,rgba(251,146,60,.22),transparent_35%),radial-gradient(circle_at_58%_62%,rgba(99,102,241,.22),transparent_45%)]" />
      <div className="grid h-full min-h-0 grid-cols-1 gap-3 px-3 py-2 lg:grid-cols-[88px_minmax(0,1fr)_410px] xl:grid-cols-[94px_minmax(0,1fr)_460px]">
        <aside className="hidden min-h-0 flex-col py-3 lg:flex">
          <div className="space-y-1.5">
            {chamberNav.map((item) => (
              <Link key={item.href} href={item.href} className="group flex items-center gap-2 rounded-xl px-2 py-2 text-[11px] text-white/65 transition hover:bg-white/10 hover:text-cyan-100">
                <span className="text-sm text-cyan-100/75">{item.icon}</span>{item.label}
              </Link>
            ))}
          </div>
          <Link href="/shopreel/operations" className="mt-auto inline-flex items-center gap-1 px-2 py-2 text-[11px] uppercase tracking-[0.15em] text-amber-100/85"><span className="text-amber-200">≡</span>Operations</Link>
        </aside>

        <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(130deg,rgba(6,10,29,.7),rgba(4,8,20,.88)_45%,rgba(11,11,28,.74))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_40px_80px_rgba(1,2,8,.6)] lg:px-6">
          <header className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.2em] text-amber-100/80">● Operator chamber online</div>
            <ShopReelNotificationsBell />
          </header>

          <section className="relative min-h-0 overflow-hidden">
            <div className="pointer-events-none absolute left-[43%] top-[40%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,.38),rgba(99,102,241,.2)_35%,transparent_65%)]" />
            <div className={`${prefersReducedMotion ? "" : "animate-[spin_34s_linear_infinite]"} pointer-events-none absolute left-[43%] top-[41%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100/25`} />
            <div className={`${prefersReducedMotion ? "" : "animate-pulse"} pointer-events-none absolute left-[43%] top-[41%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_28px_rgba(251,146,60,.8)]`} />

            <div className="relative z-10 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/72">Operator online</p>
              <h1 className="mt-2 text-5xl font-semibold leading-[0.95] text-white md:text-6xl">Operator<br />Online</h1>
              <p className="mt-4 max-w-xl text-2xl text-white/70">Continuity intact. Systems nominal. Focus your next move.</p>

              <div className="mt-5 rounded-2xl border border-white/15 bg-black/20 p-3 backdrop-blur-md">
                <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-cyan-100/75">Operator prompt</div>
                <AiCommandInput value={command} onChange={setCommand} placeholder="What should the operator run next?" className="min-h-14 rounded-full border border-white/10 bg-white/[0.02] px-4 shadow-none focus-visible:ring-0" />
                <div className="mt-3 flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => setCommand(prompt)} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/85">{prompt}</button>)}</div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button onClick={() => runCommand()} className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-6 py-2.5 text-sm font-semibold text-white">Continue</button>
                <Link href="/shopreel/review" className="rounded-xl border border-white/18 px-4 py-2.5 text-sm text-white/85">Review approvals</Link>
                <button onClick={() => dispatch({ type: "RECOVER" })} disabled={!runtimeSession.recoverableContext} className="rounded-xl border border-cyan-200/35 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50">Resume</button>
                <Link href="/shopreel/operations" className="text-xs text-white/65 underline-offset-2 hover:underline">Manual / Operations</Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-5 gap-2 border-t border-white/10 pt-2 text-xs">
            {[["Runtime pulse", "Calm"],["Continuity signal", "Stable"],["Atmosphere", "Focused"],["Momentum", "Building"],["Unresolved", `${recent.filter((item) => /needs|review|block|interrupt/i.test(item.status)).length} items`]].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white/[0.02] px-2 py-1.5">
                <div className="text-[10px] uppercase tracking-[0.13em] text-white/55">{label}</div>
                <div className="mt-0.5 text-sm text-cyan-100">{value}</div>
              </div>
            ))}
          </section>
        </main>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(155deg,rgba(8,12,30,.75),rgba(6,9,22,.92))] p-3 shadow-[0_20px_50px_rgba(2,3,10,.5)]">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <h3 className="text-sm uppercase tracking-[0.16em] text-white/90">Operational worlds</h3>
              <p className="text-xs text-white/55">Your runtime environments. Alive and remembered.</p>
            </div>
            <Link href="/shopreel/campaigns" className="text-xs text-white/70">View all</Link>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto pr-1">
              <div className="relative mx-auto mt-2 h-[640px] max-w-[320px]">
                {recent.slice(0, 5).map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/shopreel/content/${item.id}`)}
                    className="absolute left-0 right-0 w-full overflow-hidden rounded-[1.6rem] border border-white/14 bg-[radial-gradient(95%_70%_at_60%_12%,rgba(251,146,60,.25),transparent_62%),linear-gradient(170deg,rgba(12,17,40,.92),rgba(5,9,24,.98))] p-4 text-left shadow-[0_20px_45px_rgba(0,0,0,.48)]"
                    style={{ top: `${index * 36}px`, transform: `scale(${1 - index * 0.06}) translateX(${index * 16}px)`, zIndex: 12 - index, opacity: Math.max(1 - index * 0.13, 0.44) }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,10,26,.95)_76%)]" />
                    <div className="pointer-events-none absolute left-0 top-[55%] h-px w-full bg-gradient-to-r from-transparent via-cyan-100/30 to-transparent" />
                    <div className="pointer-events-none absolute right-8 top-12 h-20 w-[2px] bg-gradient-to-b from-amber-200/90 via-cyan-100/60 to-transparent" />
                    <div className="relative flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-cyan-100/75">{statusTone(item.status)}</span>
                      <span className="text-[10px] text-white/45">{index === 0 ? "Current" : `${index + 1}`}</span>
                    </div>
                    <p className="relative mt-3 line-clamp-2 text-2xl leading-tight text-white">{item.title}</p>
                    <p className="relative mt-5 text-xs text-white/66">{item.status.replaceAll("_", " ")}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>


      <div className="px-3 pb-2 lg:hidden">
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
          compact
        />
      </div>
      <div className="absolute bottom-[6.4rem] left-[7.2rem] right-[30rem] hidden lg:block">
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
          compact
        />
      </div>
    </div>
  );
}
