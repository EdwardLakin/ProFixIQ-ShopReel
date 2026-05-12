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
    <div className="space-y-6 pb-10">
      <section className={`relative overflow-hidden rounded-[2.1rem] border bg-[linear-gradient(145deg,rgba(10,16,38,.92),rgba(4,7,19,.97))] shadow-[0_40px_130px_rgba(0,0,0,0.66)] transition-all duration-300 motion-reduce:transition-none ${runtimeSession.compressedHero ? "border-cyan-200/45 p-4 md:p-5" : "border-violet-200/28 p-7 md:p-8"}`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-cyan-100/75"><span>SHOPREEL OPERATOR</span><span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2 py-0.5 text-[10px]">{runtimeSession.compressedHero ? "Runtime active" : "Operator ready"}</span></div>
          {!runtimeSession.compressedHero ? <h1 className="mt-3 max-w-[14ch] text-3xl font-semibold text-white md:text-5xl">What should the operator run next?</h1> : <p className="mt-2 text-sm text-cyan-100/80">{runtimeSession.lastOperatorSummary}</p>}
          <div className={`mt-4 rounded-[1.5rem] border border-violet-300/45 bg-[#090f25]/94 p-3 transition-all duration-300 ${runtimeSession.compressedHero ? "max-w-4xl" : "max-w-5xl"}`}>
            <AiCommandInput value={command} onChange={setCommand} placeholder="Describe what you want to create or accomplish…" className={`${runtimeSession.compressedHero ? "min-h-20" : "min-h-32"} border-transparent bg-transparent shadow-none focus-visible:ring-0`} />
            <div className="mt-2 flex flex-wrap gap-2">{quickPrompts.map((prompt) => <button key={prompt} onClick={() => setCommand(prompt)} className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs text-white/82">{prompt}</button>)}</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => runCommand()} className="rounded-xl bg-gradient-to-r from-violet-500/90 to-cyan-400/85 px-4 py-2 text-sm font-semibold text-white">Plan next move</button>
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
      />

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs uppercase tracking-[0.15em] text-white/55">Runtime utilities</div>
        <div className="mt-2 text-sm text-white/75">Use direct routes as compact utility interruptions while the runtime session remains active.</div>
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
