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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(120%_90%_at_52%_-12%,rgba(95,69,218,.34),transparent_55%),radial-gradient(70%_65%_at_2%_90%,rgba(31,161,222,.18),transparent_68%),linear-gradient(145deg,#030610,#060a18_40%,#080b1a)] px-4 pb-4 pt-3 lg:h-[100svh] lg:px-5 lg:pb-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(6,11,32,.92),rgba(6,9,25,.74)_35%,rgba(15,13,32,.72)_66%,rgba(15,10,24,.92))]" />
      <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[84px_minmax(0,1fr)_340px]">
        <aside className="hidden min-h-0 flex-col py-4 lg:flex">
          <div className="space-y-2">
            {chamberNav.map((item) => (
              <Link key={item.href} href={item.href} aria-label={item.label} title={item.label} className="group flex items-center gap-2 rounded-xl px-2 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-cyan-100">
                <span className="text-sm text-cyan-200/75">{item.icon}</span>
                <span className="text-[11px]">{item.label}</span>
              </Link>
            ))}
          </div>
          <Link href="/shopreel/operations" className="mt-auto inline-flex items-center gap-2 px-2 py-2 text-[11px] uppercase tracking-[0.12em] text-amber-100/85"><span className="text-amber-200">≡</span>Operations</Link>
        </aside>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-2.5">
          <section className="relative min-h-0 overflow-hidden rounded-[1.8rem] bg-[linear-gradient(140deg,rgba(9,14,33,.8),rgba(4,8,21,.9)_48%,rgba(12,11,25,.82))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_18px_48px_rgba(1,3,10,.5)]">
            <div className="pointer-events-none absolute right-[2.2rem] top-[6.4rem] h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,.35),rgba(124,58,237,.28)_45%,transparent_72%)]" />
            <div className={`${prefersReducedMotion ? "" : "animate-[spin_26s_linear_infinite]"} pointer-events-none absolute right-[3.2rem] top-[7.1rem] h-20 w-20 rounded-full border border-cyan-100/25`} />
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/70">Operator online</div>
                <h1 className="mt-1 text-3xl font-semibold text-white">Operator Online</h1>
                <p className="mt-1 text-sm text-white/75">Continuity intact. Systems nominal. Focus your next move.</p>
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
              compact
            />
          </section>

          <section className="grid grid-cols-5 gap-2 border-t border-white/10 px-2 py-2 text-xs">
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

        <aside className="min-h-0 h-full max-h-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(10,14,32,.74),rgba(8,11,27,.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Operational Worlds</h3>
            <span className="text-[11px] text-white/55">Recent continuity</span>
          </div>
          <div className="h-[calc(100%-2rem)] min-h-0 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(103,232,249,.35)_transparent] [scrollbar-width:thin]">
            <div className="grid gap-2.5">
            {recent.slice(0, 12).map((item) => (
              <button key={item.id} onClick={() => router.push(`/shopreel/content/${item.id}`)} className="relative block min-h-[220px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(88%_60%_at_84%_14%,rgba(251,146,60,.3),transparent_58%),radial-gradient(120%_90%_at_60%_100%,rgba(99,102,241,.28),rgba(5,8,22,.92)_70%)] p-3.5 text-left shadow-[0_16px_45px_rgba(0,0,0,.42)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,10,26,.9)_74%)]" />
                <div className="pointer-events-none absolute -right-8 top-8 h-24 w-24 rounded-full bg-amber-200/20 blur-2xl" />
                <div className="pointer-events-none absolute left-0 top-[42%] h-px w-full bg-gradient-to-r from-transparent via-cyan-100/30 to-transparent" />
                <div className="pointer-events-none absolute right-7 top-10 h-24 w-[2px] bg-gradient-to-b from-amber-200/80 via-cyan-100/55 to-transparent" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/70">{statusTone(item.status)}</span>
                  <span className="text-[10px] text-white/45">{item.id.slice(0, 8)}</span>
                </div>
                <p className="relative mt-2 line-clamp-2 text-xl leading-tight text-white">{item.title}</p>
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
