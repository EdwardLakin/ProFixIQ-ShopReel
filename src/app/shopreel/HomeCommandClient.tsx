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
  { label: "Home", href: "/shopreel" },
  { label: "Workspace", href: "/shopreel/campaigns" },
  { label: "Continuity", href: "/shopreel/operator" },
  { label: "Approvals", href: "/shopreel/review" },
  { label: "Reports", href: "/shopreel/analytics" },
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
    <div className="relative h-[calc(100vh-8.5rem)] min-h-[720px] overflow-hidden rounded-[2.1rem] border border-violet-200/20 bg-[linear-gradient(140deg,rgba(4,8,20,.98),rgba(6,10,26,.95))] p-3 md:p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(95%_60%_at_65%_2%,rgba(99,102,241,0.2),transparent_70%),radial-gradient(75%_75%_at_0%_100%,rgba(56,189,248,0.13),transparent_75%)]" />
      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[72px_minmax(0,1fr)_330px]">
        <aside className="hidden min-h-0 flex-col rounded-2xl border border-white/10 bg-black/25 p-2 lg:flex">
          <div className="space-y-2">
            {chamberNav.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg border border-white/10 px-2 py-2 text-center text-xs text-white/75 hover:border-cyan-200/35 hover:text-cyan-100">{item.label}</Link>
            ))}
          </div>
          <div className="mt-auto rounded-lg border border-cyan-300/35 bg-cyan-400/12 px-2 py-2 text-center text-xs font-medium text-cyan-100">Operations</div>
        </aside>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-3">
          <section className="rounded-2xl border border-white/12 bg-black/25 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-100/70">Operator Online</div>
                <p className="mt-1 text-sm text-white/75">Continuity intact. Systems nominal.</p>
              </div>
              <ShopReelNotificationsBell />
            </div>
            <div className="mt-3 rounded-xl border border-violet-300/35 bg-[#090f25]/85 p-3">
              <div className="mb-2 text-xs text-cyan-100/75">Operator prompt</div>
              <AiCommandInput value={command} onChange={setCommand} placeholder="What should the operator run next?" className="min-h-16 border-transparent bg-transparent shadow-none focus-visible:ring-0" />
              <div className="mt-2 flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => setCommand(prompt)} className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs text-white/82">{prompt}</button>)}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => runCommand()} className="rounded-xl bg-gradient-to-r from-violet-500/90 to-cyan-400/85 px-4 py-2 text-sm font-semibold text-white">Continue</button>
              <button onClick={() => dispatch({ type: "RECOVER" })} disabled={!runtimeSession.recoverableContext} className="rounded-xl border border-cyan-200/35 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100 disabled:opacity-50">Continue where you left off</button>
              <Link href="/shopreel/review" className="rounded-xl border border-white/18 px-3 py-2 text-sm text-white/80">Review approvals</Link>
            </div>
          </section>

          <div className="min-h-0 overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/20">
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
          </div>

          <section className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5 text-xs md:grid-cols-5">
            {[
              ["Runtime pulse", "Calm"],
              ["Continuity signal", "Stable"],
              ["Atmosphere", "Focused"],
              ["Momentum", "Building"],
              ["Unresolved", `${recent.filter((item) => /needs|review|block|interrupt/i.test(item.status)).length} items`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/55">{label}</div>
                <div className="mt-0.5 text-sm text-cyan-100">{value}</div>
              </div>
            ))}
          </section>

          <section className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
            {["campaigns", "review", "library", "operations"].map((route) => (
              <Link key={route} href={`/shopreel/${route}`} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 capitalize">{route}</Link>
            ))}
          </section>
        </div>

        <aside className="min-h-0 rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Operational Worlds</h3>
            <span className="text-[11px] text-white/55">Recent continuity</span>
          </div>
          <div className="h-[calc(100%-2rem)] min-h-0 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:rgba(103,232,249,.35)_transparent] [scrollbar-width:thin]">
            <div className="grid gap-2">
            {recent.slice(0, 12).map((item) => (
              <button key={item.id} onClick={() => router.push(`/shopreel/content/${item.id}`)} className="block w-full rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(21,26,46,.6),rgba(7,11,24,.86))] p-3 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/70">{statusTone(item.status)}</span>
                  <span className="text-[10px] text-white/45">{item.id.slice(0, 8)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-white">{item.title}</p>
                <div className="mt-2 text-xs text-white/60">Stage: {item.status.replaceAll("_", " ")}</div>
                <div className="text-xs text-white/45">Continue where you left off</div>
              </button>
            ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
