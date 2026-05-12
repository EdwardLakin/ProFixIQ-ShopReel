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
import { persistRuntimeSession, readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

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

const quickPrompts = ["Launch campaign", "Generate hooks", "Refine tone", "Review approvals", "Build publish package"];

export default function HomeCommandClient({ recent }: { recent: RecentItem[] }) {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [context, setContext] = useState<WorkspaceMemory | null>(null);
  const interpreted = useMemo(() => interpretCommand(command), [command]);
  const [runtimeSession, dispatch] = useReducer(operatorRuntimeSessionReducer, initialOperatorRuntimeSession);
  const [campaignContext, setCampaignContext] = useState<RuntimeCampaignContext | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  }, []);

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

  return (
    <div className="relative space-y-6 overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_82%_4%,rgba(99,102,241,0.18),transparent_70%),radial-gradient(85%_80%_at_3%_96%,rgba(56,189,248,0.12),transparent_72%)]" />
      <section className={`relative overflow-hidden rounded-[2.3rem] border bg-[linear-gradient(145deg,rgba(7,11,28,.95),rgba(3,6,17,.98))] shadow-[0_40px_130px_rgba(0,0,0,0.66)] transition-all duration-300 motion-reduce:transition-none ${runtimeSession.compressedHero ? "border-cyan-200/40 p-4 md:p-5" : "border-violet-200/25 p-6 md:p-7"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_85%_0%,rgba(102,146,255,0.17),transparent_62%),radial-gradient(95%_75%_at_0%_100%,rgba(181,126,255,0.14),transparent_58%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-100/75"><span>SHOPREEL OPERATOR</span><span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2 py-0.5 text-[10px]">{runtimeSession.compressedHero ? "Runtime active" : "Operator ready"}</span></div>
          {!runtimeSession.compressedHero ? <h1 className="mt-3 max-w-[14ch] text-3xl font-semibold text-white md:text-5xl">What should the operator run next?</h1> : <p className="mt-2 text-sm text-cyan-100/80">{runtimeSession.lastOperatorSummary}</p>}
          <div className={`mt-4 rounded-[1.5rem] border border-violet-300/45 bg-[#090f25]/94 p-3 transition-all duration-300 ${runtimeSession.compressedHero ? "max-w-4xl" : "max-w-5xl"}`}>
            <AiCommandInput value={command} onChange={setCommand} placeholder="Describe what you want to create or accomplish…" className={`${runtimeSession.compressedHero ? "min-h-20" : "min-h-32"} border-transparent bg-transparent shadow-none focus-visible:ring-0`} />
            <div className="mt-2 flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => setCommand(prompt)} className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs text-white/82">{prompt}</button>)}</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => runCommand()} className="rounded-xl bg-gradient-to-r from-violet-500/90 to-cyan-400/85 px-4 py-2 text-sm font-semibold text-white">Plan next move</button>
            <button onClick={() => dispatch({ type: "RECOVER" })} disabled={!runtimeSession.recoverableContext} className="rounded-xl border border-cyan-200/35 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100 disabled:opacity-50">Continue where you left off</button>
            <button onClick={() => dispatch({ type: "SET_COMPRESSED_HERO", compressed: false })} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80">Restore hero</button>
            <Link href="/shopreel/review" className="rounded-xl border border-white/18 px-4 py-2 text-sm text-white/80">Review approvals</Link>
            <div className="ml-auto"><ShopReelNotificationsBell /></div>
          </div>
        </div>
      </section>

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
      />

      <section className="relative overflow-x-auto rounded-[1.6rem] border border-white/10 bg-[linear-gradient(135deg,rgba(8,11,23,.8),rgba(4,7,16,.7))] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Recent operational worlds</div>
          <div className="text-[11px] text-white/55">Compressed cinematic rail</div>
        </div>
        <div className="flex min-w-max gap-3 pb-1">
          {recent.slice(0, 10).map((item, index) => {
            const tone = /await|review|needs/i.test(item.status)
              ? "border-amber-300/35 bg-amber-400/10 text-amber-100"
              : /paused|interrupt/i.test(item.status)
                ? "border-violet-300/35 bg-violet-400/10 text-violet-100"
                : /active|running|draft/i.test(item.status)
                  ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-100"
                  : "border-emerald-300/30 bg-emerald-500/10 text-emerald-100";
            return (
              <article key={item.id} className={`w-[280px] rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(21,26,46,.6),rgba(7,11,24,.86))] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.36)] transition-all duration-300 ${prefersReducedMotion ? "" : index === 0 ? "scale-100" : "scale-[0.96] opacity-80"}`}>
                <div className="text-[11px] uppercase tracking-[0.12em] text-white/55">Standby world</div>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-white">{item.title}</p>
                <div className={`mt-3 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${tone}`}>{item.status}</div>
                <div className="mt-2 text-[11px] text-white/50">Continuity retained for interruption-safe restoration.</div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/15 p-4 opacity-85">
        <div className="text-xs uppercase tracking-[0.15em] text-white/55">Runtime utilities</div>
        <div className="mt-2 text-sm text-white/75">Manual operations stay compact as utility interruptions while operator continuity remains primary.</div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link href="/shopreel/campaigns" className="rounded-lg border border-white/10 px-3 py-2 text-white/80">Campaigns</Link>
          <Link href="/shopreel/review" className="rounded-lg border border-white/10 px-3 py-2 text-white/80">Review</Link>
          <Link href="/shopreel/library" className="rounded-lg border border-white/10 px-3 py-2 text-white/80">Library</Link>
          <Link href="/shopreel/operations" className="rounded-lg border border-white/10 px-3 py-2 text-white/80">Operations</Link>
        </div>
      </section>
    </div>
  );
}
