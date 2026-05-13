"use client";

import Link from "next/link";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransitionRouter } from "@/features/shopreel/ui/system/TransitionProvider";
import ShopReelNotificationsBell from "@/features/shopreel/ui/ShopReelNotificationsBell";
import { AiCommandInput, interpretCommand } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import {
  buildContinuityThreads,
  buildPendingTasks,
  readWorkspaceMemory,
  type WorkspaceMemory,
  writeWorkspaceMemory,
} from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { buildOperationalGraph, planCommandExecution } from "@/features/shopreel/ui/system/operationalGraph";
import { executeShopReelCommand } from "@/features/shopreel/ui/system/executeShopReelCommand";
import { resolveCapabilityForWorld } from "@/features/shopreel/ui/system/operatorCapabilities";
import { resolveOperatorRuntime } from "@/features/shopreel/ui/system/resolveOperatorRuntime";
import OperatorRuntimeCanvas from "@/features/shopreel/ui/system/OperatorRuntimeCanvas";
import {
  buildInterruptAction,
  buildRuntimeStartAction,
  initialOperatorRuntimeSession,
  operatorRuntimeSessionReducer,
} from "@/features/shopreel/ui/system/operatorRuntimeSession";
import {
  persistRuntimeSession,
  persistWorldEntrySnapshot,
  readPersistedRuntimeSession,
  type PersistedChamberMemory,
} from "@/features/shopreel/ui/system/runtimeSessionPersistence";
import type { OperatorWorldCard } from "@/features/shopreel/operator/operatorWorlds";
import { aggregateOperatorMemory } from "@/features/shopreel/operator-memory/aggregation";
import type { OperatorMemoryRecord } from "@/features/shopreel/operator-memory/models";
import { aggregateWorkspaceTimeline } from "@/features/shopreel/workspace-timeline/aggregation";
import type { WorkspaceTimelineEvent } from "@/features/shopreel/workspace-timeline/models";
import { deriveOperatorOrchestrationPlan } from "@/features/shopreel/ui/system/operatorOrchestration";
import { buildWorldEntryIntent, resolveWorldFromEntityKind, resolveWorldEntryForHref } from "@/features/shopreel/ui/system/pageToWorldAdapter";
import { buildWorldSnapshot } from "@/features/shopreel/ui/system/worldSnapshot";
import { createWorldEntryTransition } from "@/features/shopreel/ui/system/runtimeWorldTransition";
import { consumeRuntimeReturnState } from "@/features/shopreel/ui/system/runtimeSpatialTransition";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import { RUNTIME_WORLD_COMPOSITIONS } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import { deriveRuntimeOperatorPriority, deriveRuntimeOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import { buildRuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import { buildRuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";


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

function getDeckCardVisualIdentity(item: OperatorWorldCard, worldId: string): string {
  return `${worldId}:${item.title.toLowerCase()}:${item.normalizedStatus}:${item.priority}`;
}

function buildWorldEntrySnapshotFromCard(item: OperatorWorldCard) {
  const worldId = resolveWorldFromEntityKind(item.kind);
  return {
    worldId,
    href: item.href,
    entityId: item.id,
    entityKind: item.kind,
    title: item.title,
    status: item.normalizedStatus,
    visualSeed: getDeckCardVisualIdentity(item, worldId),
    guidedStep: null,
  };
}

function getResumeWorldHref(fallback?: string): string {
  return readPersistedRuntimeSession()?.worldContinuity.activeRoute ?? fallback ?? "/shopreel";
}

function statusTone(status: string) {
  if (/review|approval/i.test(status)) return "Awaiting review";
  if (/block|failed|error|interrupted/i.test(status)) return "Interrupted";
  if (/in_progress|running|draft|active/i.test(status)) return "Active";
  if (/completed|published/i.test(status)) return "Complete";
  return "Stable";
}

export default function HomeCommandClient({ recent }: { recent: OperatorWorldCard[] }) {
  const router = useRouter();
  const { startWorldEntryTransition } = useTransitionRouter();
  const [command, setCommand] = useState("");
  const [context, setContext] = useState<WorkspaceMemory | null>(null);
  const interpreted = useMemo(() => interpretCommand(command), [command]);
  const [runtimeSession, dispatch] = useReducer(operatorRuntimeSessionReducer, initialOperatorRuntimeSession);
  const [campaignContext, setCampaignContext] = useState<RuntimeCampaignContext | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [chamberMemory, setChamberMemory] = useState<PersistedChamberMemory | null>(null);
  const [emphasizedCardId, setEmphasizedCardId] = useState<string | null>(null);
  const [isCommandRunning, setIsCommandRunning] = useState(false);
  const deckRef = useRef<HTMLDivElement | null>(null);

  const unresolvedCount = recent.filter((item) => item.priority === "critical" || /review|approval/.test(item.normalizedStatus)).length;
  const hasPendingApprovals = recent.some((item) => /review|approval/.test(item.normalizedStatus));
  const hasActiveCampaign = recent.some((item) => item.kind === "campaign");
  const hasRecentWorlds = recent.length > 0;
  const activeWorld = recent[0] ?? null;

  const deckOrchestrations = useMemo(() => recent.slice(0, 8).map((item) => {
    const worldId = resolveWorldFromEntityKind(item.kind);
    return deriveRuntimeOrchestration({
      worldId,
      status: item.normalizedStatus,
      blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [],
      unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0,
      guidedStepId: null,
      previousWorldId: runtimeSession.previousWorldId,
      lastActionLabel: runtimeSession.worldContinuity.lastAction?.label ?? null,
      breadcrumbs: runtimeSession.worldContinuity.breadcrumbs,
      composition: RUNTIME_WORLD_COMPOSITIONS[worldId] ?? { worldId, panels: [] },
      now: new Date().toISOString(),
      lastTransitionAt: item.updatedAt ?? null,
    });
  }), [recent, runtimeSession.previousWorldId, runtimeSession.worldContinuity.breadcrumbs, runtimeSession.worldContinuity.lastAction?.label]);
  const operatorPriority = useMemo(() => deriveRuntimeOperatorPriority(deckOrchestrations), [deckOrchestrations]);

  const atmosphereClass = operatorPriority?.highestPressureWorld ? (deckOrchestrations.some((x) => x.operationalPressure === "critical") ? "from-slate-950 via-indigo-950 to-slate-950" : deckOrchestrations.some((x) => x.flowHealth === "resolved") ? "from-slate-900 via-cyan-950 to-indigo-950" : "from-slate-950 via-violet-950 to-slate-950") : "from-slate-950 via-violet-950 to-slate-950";
  const orchestrationPlan = useMemo(() => {
    const records: OperatorMemoryRecord[] = recent.map((world) => ({
      id: `mem-${world.id}`,
      shopId: "runtime",
      userId: "operator",
      sessionId: null,
      memoryKey: `${world.kind}:${world.id}`,
      memoryKind: /review|approval/.test(world.normalizedStatus) ? "pending_approval" : world.kind === "render_job" ? "pending_render" : world.kind === "manual_asset" ? "recent_upload" : "unfinished_draft",
      unresolved: /review|approval|failed|blocked|pending/.test(world.normalizedStatus),
      payload: { entityKind: world.kind, entityId: world.id, campaignId: world.kind === "campaign" ? world.id : null },
      createdAt: world.updatedAt ?? new Date(0).toISOString(),
      updatedAt: world.updatedAt ?? new Date(0).toISOString(),
    }));
    const events: WorkspaceTimelineEvent[] = recent.map((world) => ({
      id: `evt-${world.id}`,
      shopId: "runtime",
      userId: null,
      sessionId: null,
      entityKind: world.kind,
      entityId: world.id,
      eventType: world.kind === "render_job" ? "render_started" : world.kind === "publication" ? "publish_scheduled" : "operator_edit",
      unresolved: /failed|blocked|pending/.test(world.normalizedStatus),
      reasoningTrace: null,
      payload: { campaignId: world.kind === "campaign" ? world.id : undefined },
      createdAt: world.updatedAt ?? new Date(0).toISOString(),
    }));
    return deriveOperatorOrchestrationPlan({
      memory: aggregateOperatorMemory(records),
      timeline: aggregateWorkspaceTimeline(events),
      fallbackCapability: activeWorld ? resolveCapabilityForWorld(activeWorld) : "workspace_recovery",
    });
  }, [activeWorld, recent]);

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
    if (!persistedRuntime) return;

    setChamberMemory(persistedRuntime.chamberMemory);
    dispatch({
      type: "START_RUNTIME",
      command: parsed.lastCommand ?? "",
      resolution: {
        state: persistedRuntime.progressionStage,
        surfaceId: persistedRuntime.activeSurface,
        transitionMode: "restore_previous",
        confidence: "high",
        summary: "Restored runtime continuity from last workspace.",
        recommendedRouteFallback: persistedRuntime.returnTarget,
        contextCarryover: {
          rawCommand: parsed.lastCommand ?? "",
          interpretedIntent: "unknown",
          selectedCampaignId: persistedRuntime.activeCampaignId,
          hasPendingApprovals,
          hasActiveCampaign,
          hasAssetsContext: Boolean(parsed.creativeContinuity),
        },
      },
    });
  }, [recent]);

  useEffect(() => {
    persistRuntimeSession(runtimeSession);
    const persistedRuntime = readPersistedRuntimeSession();
    setChamberMemory(persistedRuntime?.chamberMemory ?? null);
  }, [runtimeSession]);


  useEffect(() => {
    const returning = consumeRuntimeReturnState();
    if (!returning) return;
    window.scrollTo({ top: returning.scrollY, behavior: "auto" });
    setEmphasizedCardId(returning.restoreCardId);
    const id = window.setTimeout(() => setEmphasizedCardId(null), 950);
    return () => window.clearTimeout(id);
  }, []);

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

  const persistContext = (route: string) => {
    const pendingTasks = buildPendingTasks(interpreted.intent);
    const operationalGraph = buildOperationalGraph({
      generationId: recent.find((item) => item.kind === "generation")?.id,
      campaignId: context?.lastCampaignId,
      pendingTaskCount: pendingTasks.filter((task) => !task.done).length,
      blockerCount: pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length,
      readyTaskCount: recent.filter((item) => item.normalizedStatus === "completed").length,
      interrupted: false,
      continuityThreadCount: 0,
      lastRoute: route,
    });

    const base = context ?? readWorkspaceMemory();
    if (!base) return;

    const next: WorkspaceMemory = {
      ...base,
      lastWorkflow: interpreted.intent,
      lastCommand: command,
      lastRoute: route,
      pendingTasks,
      continuityThreads: buildContinuityThreads({ intent: interpreted.intent, pendingTasks, lastRoute: route }),
      operationalGraph,
      lastExecutionPlan: planCommandExecution(command, operationalGraph, route, interpreted.intent),
      updatedAt: new Date().toISOString(),
    };

    writeWorkspaceMemory(next);
    setContext(next);
  };

  const runCommand = async (overrideCommand?: string) => {
    if (isCommandRunning) return;
    const nextCommand = overrideCommand ?? command;
    if (!nextCommand.trim()) return;
    setIsCommandRunning(true);
    const execution = executeShopReelCommand({
      command: nextCommand,
      lastRoute: context?.lastRoute,
      source: "home_command",
      recentWorlds: recent,
      orchestrationPlan,
    });

    const runtime = resolveOperatorRuntime({
      rawCommand: nextCommand,
      classifiedIntent: execution.commandIntent,
      currentPath: context?.lastRoute ?? "/shopreel",
      selectedCampaignId: context?.lastCampaignId ?? null,
      hasPendingApprovals,
      hasActiveCampaign: hasActiveCampaign || hasRecentWorlds,
      hasAssetsContext: Boolean(context?.creativeContinuity),
    });

    dispatch(buildRuntimeStartAction(runtime, nextCommand));
    dispatch({ type: "SET_ORCHESTRATION_PLAN", plan: orchestrationPlan });
    dispatch({
      type: "SET_CAPABILITY_CONTEXT",
      capability: execution.typedAction?.target.capability ?? null,
      activeEntity: execution.typedAction ? { kind: execution.typedAction.target.entityKind, id: execution.typedAction.target.entityId } : null,
      queuedNextAction: execution.typedAction,
      unresolvedIndicators: execution.actionResult?.ok ? [] : [execution.actionResult?.reason ?? ""],
      lastRoute: execution.selectedRoute,
      recoveryTarget: execution.selectedRoute,
    });
    persistContext(execution.selectedRoute);
    if (overrideCommand) setCommand(overrideCommand);
    setIsCommandRunning(false);
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-[#02040c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_42%_36%,rgba(255,171,75,.24),transparent_18%),radial-gradient(circle_at_50%_52%,rgba(111,76,255,.28),transparent_32%),radial-gradient(circle_at_86%_38%,rgba(70,160,255,.15),transparent_30%),linear-gradient(135deg,#02040c_0%,#060815_48%,#04030b_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />

      <div className="relative z-10 grid h-full min-h-0 grid-cols-1 lg:grid-cols-[170px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/[0.06] bg-black/10 px-7 py-7 lg:flex lg:flex-col">
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold tracking-[0.1em]">PROFIXIQ</div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/58">ShopReel Operator</div>
          </div>

          <div className="mt-14 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,177,76,.95)_0_7%,rgba(255,177,76,.22)_8%_16%,transparent_17%),repeating-radial-gradient(circle,rgba(255,177,76,.25)_0_1px,transparent_1px_13px)] shadow-[0_0_45px_rgba(255,150,60,.35)]" />

          <nav className="mt-14 space-y-4">
            {chamberNav.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm transition ${
                  index === 0
                    ? "bg-indigo-400/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06),0_0_34px_rgba(124,58,237,.18)]"
                    : "text-white/52 hover:bg-white/[0.055] hover:text-white"
                }`}
              >
                <span className="text-base text-cyan-100/75">{item.icon}</span>
                <span>{item.label}</span>
                {index === 0 ? (
                  <span className="ml-auto h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_16px_rgba(251,146,60,.9)]" />
                ) : null}
              </Link>
            ))}
          </nav>

          <Link
            href="/shopreel/operations"
            className="mt-auto flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-amber-100/88"
          >
            <span className="text-lg">≡</span>
            Operations
          </Link>
        </aside>

        <main className="relative grid h-full min-h-0 grid-rows-[72px_minmax(0,1fr)_128px] overflow-hidden px-6 py-5 lg:px-8 xl:px-10">
          <header className="flex items-center justify-between">
            <div className="hidden items-center gap-3 text-[12px] uppercase tracking-[0.26em] text-amber-100/88 md:flex">
              <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(251,146,60,.95)]" />
              Operator chamber online
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-white/72">
                ⌕
              </button>
              <ShopReelNotificationsBell />
              <button
                type="button"
                onClick={() => dispatch({ type: "RECOVER" })}
                className="rounded-2xl border border-white/10 bg-white/[0.055] px-5 py-3 text-sm font-semibold text-white"
              >
                Resume
              </button>
            </div>
          </header>

          <section className="relative grid min-h-0 items-center gap-8 overflow-hidden lg:grid-cols-[minmax(420px,.78fr)_minmax(560px,1fr)] xl:grid-cols-[minmax(480px,.78fr)_minmax(680px,1fr)]">
            <div className="relative z-10 max-w-3xl">
              <div className="pointer-events-none absolute left-[86%] top-[-8%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,177,76,.85)_0_1.6%,rgba(255,177,76,.25)_2.5%_5%,transparent_8%),repeating-radial-gradient(circle,rgba(255,177,76,.18)_0_1px,transparent_1px_20px)] opacity-90" />
              <div
                className={`${
                  prefersReducedMotion ? "" : "animate-[spin_38s_linear_infinite]"
                } pointer-events-none absolute left-[86%] top-[12%] h-80 w-80 -translate-x-1/2 rounded-full border border-violet-200/10`}
              />
              <div className="pointer-events-none absolute left-[86%] top-[19%] h-3 w-3 -translate-x-1/2 rounded-full bg-amber-200 shadow-[0_0_42px_rgba(251,146,60,.95)]" />

              <div className="relative">
                <div className="text-[12px] uppercase tracking-[0.26em] text-indigo-200/88">Operator online</div>
                <h1 className="mt-5 text-[clamp(4.8rem,9vw,8.8rem)] font-semibold leading-[0.88] tracking-[-0.075em] text-white">
                  Operator
                  <br />
                  <span className="bg-gradient-to-r from-white via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                    Online
                  </span>
                </h1>
                <p className="mt-7 max-w-2xl text-[clamp(1.2rem,1.7vw,1.8rem)] leading-snug text-white/64">
                  Continuity intact. Systems nominal. Focus your next move.
                </p>

                <div className="mt-8 max-w-3xl">
                  <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-white/50">Operator prompt</div>
                  <form
                    className="relative z-30 flex items-center rounded-3xl border border-white/14 bg-[#071024]/60 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_18px_55px_rgba(0,0,0,.24)]"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void runCommand();
                    }}
                  >
                    <AiCommandInput
                      value={command}
                      onChange={setCommand}
                      placeholder="What should the operator run next?"
                      readOnly={isCommandRunning}
                      className="min-h-16 flex-1 border-0 bg-transparent pr-2 shadow-none focus-visible:ring-0"
                    />
                    <button
                      type="submit"
                      disabled={isCommandRunning || !command.trim()}
                      aria-label="Submit operator prompt"
                      className="text-3xl text-white/48 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isCommandRunning ? "…" : "→"}
                    </button>
                  </form>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {quickPrompts.map((prompt) => (
                      <button
                        type="button"
                        key={prompt}
                        onClick={() => setCommand(prompt)}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/78 transition hover:border-cyan-200/35 hover:bg-cyan-300/10"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => void runCommand()}
                      disabled={isCommandRunning || !command.trim()}
                      className="group rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-300 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_42px_rgba(124,58,237,.36)]"
                    >
                      {isCommandRunning ? "Running…" : <>Continue <span className="ml-4 inline-block transition group-hover:translate-x-1">→</span></>}
                    </button>
                    <Link href="/shopreel/review" className="rounded-2xl border border-white/12 bg-white/[0.035] px-6 py-4 text-sm text-white/80">
                      Review approvals
                      {unresolvedCount ? <span className="ml-2 rounded-full bg-violet-500 px-2 py-0.5 text-xs">{unresolvedCount}</span> : null}
                    </Link>
                    <Link href="/shopreel/operations" className="text-sm text-white/46 hover:text-white">
                      Manual / Operations →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <aside className="relative z-20 min-h-0 overflow-visible">
              <div className="mb-8 flex items-end justify-between pl-4">
                <div>
                  <div className="text-[12px] uppercase tracking-[0.26em] text-white/78">Operational Worlds</div>
                  <p className="mt-3 text-sm text-white/48">Your runtime environments. Alive and remembered. Priority: {operatorPriority?.highestPressureWorld ?? "none"}.</p>
                </div>
                <Link href="/shopreel/campaigns" className="text-sm text-white/58 hover:text-white">
                  View all →
                </Link>
              </div>
              <button type="button" onClick={() => router.push(getResumeWorldHref(operatorPriority ? `/shopreel/${operatorPriority.recommendedReturnWorld}` : undefined))} className="mb-4 ml-4 rounded-xl border border-cyan-200/30 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-100">Resume active world</button>

              <div className="relative overflow-x-auto pb-3" role="region" aria-label="Operational world deck">
                <div className="flex min-w-max snap-x snap-mandatory gap-4 pr-4">
                {recent.slice(0, 8).sort((a, b) => {
                  const aScore = (a.priority === "critical" ? 3 : a.priority === "high" ? 2 : 1);
                  const bScore = (b.priority === "critical" ? 3 : b.priority === "high" ? 2 : 1);
                  return bScore - aScore || (new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
                }).map((item, index) => {
                  const active = index === 0;
                  const worldKind = resolveWorldFromEntityKind(item.kind);
                  const choreography = deriveWorldChoreography({
                    worldId: worldKind,
                    status: item.normalizedStatus,
                    blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [],
                    unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0,
                    guidedStepId: null,
                    previousWorldId: runtimeSession.previousWorldId,
                    lastActionLabel: runtimeSession.worldContinuity.lastAction?.label ?? null,
                    breadcrumbs: runtimeSession.worldContinuity.breadcrumbs,
                    composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] },
                    availableActions: [{ label: item.actionLabel }],
                    transitionIntent: null,
                  });
                  const deckGraph = buildRuntimeEntityGraph({
                    activeWorldId: worldKind,
                    activeRoute: item.href,
                    previousWorldId: runtimeSession.previousWorldId,
                    worldTransitionHistory: runtimeSession.worldTransitionHistory,
                    worldSnapshot: { entityId: item.id, entityKind: item.kind, title: item.title, status: item.normalizedStatus, href: item.href },
                    continuity: { activeEntityId: item.id, breadcrumbs: runtimeSession.worldContinuity.breadcrumbs, activeRoute: runtimeSession.worldContinuity.activeRoute },
                    composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] },
                    status: item.normalizedStatus,
                    blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [],
                    unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0,
                  });
                  const temporalMemory = buildRuntimeTemporalMemory({
                    now: new Date().toISOString(),
                    activeWorldId: worldKind,
                    status: item.normalizedStatus,
                    unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0,
                    blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [],
                    breadcrumbs: runtimeSession.worldContinuity.breadcrumbs,
                    transitionHistory: runtimeSession.worldTransitionHistory,
                    choreography,
                    orchestration: deriveRuntimeOrchestration({ worldId: worldKind, status: item.normalizedStatus, blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [], unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0, guidedStepId: null, previousWorldId: runtimeSession.previousWorldId, lastActionLabel: runtimeSession.worldContinuity.lastAction?.label ?? null, breadcrumbs: runtimeSession.worldContinuity.breadcrumbs, composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] }, now: new Date().toISOString(), lastTransitionAt: item.updatedAt ?? null }),
                    entityGraph: deckGraph,
                  });
                  return (
                    <button
                      type="button"
                      key={`${item.kind}-${item.id}`}
                      onClick={(event) => {
                        const worldId = resolveWorldFromEntityKind(item.kind);
                        const worldSnapshot = buildWorldSnapshot(item);
                        const worldEntryIntent = buildWorldEntryIntent({
                          worldId,
                          href: item.href,
                          entityKind: item.kind,
                          entityId: item.id,
                          source: "home_deck",
                          recommendedAction: worldSnapshot.recommendation?.actionId,
                          fallbackRoute: worldSnapshot.recommendation?.route,
                        });
                        dispatch({
                          type: "SET_WORLD_CONTEXT",
                          activeWorldId: resolveWorldEntryForHref(item.href),
                          worldEntryIntent,
                          focusedWorldEntity: { kind: item.kind, id: item.id },
                          worldRecommendation: worldSnapshot.recommendation?.reason ?? null,
                          worldEntrySnapshot: {
                            worldId,
                            href: item.href,
                            entityId: item.id,
                            entityKind: item.kind,
                            title: item.title,
                            status: item.normalizedStatus,
                            visualSeed: `${worldId}:${item.title.toLowerCase()}:${item.normalizedStatus}:${item.priority}`,
                            guidedStep: null,
                          },
                          reason: "home_deck_entry",
                        });
                        const snapshot = buildWorldEntrySnapshotFromCard(item);
                        const rect = event.currentTarget.getBoundingClientRect();
                        startWorldEntryTransition({
                          worldId: snapshot.worldId,
                          href: snapshot.href,
                          title: snapshot.title,
                          cardRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                          operatorPriorityContext: { rank: Math.max(1, index + 1), unresolvedCount: unresolvedCount, hasBlocker: /failed|blocked|error/.test(item.normalizedStatus) },
                          atmosphere: {
                            tone: /failed|blocked|error/.test(item.normalizedStatus) ? "critical" : /review|approval|pending/.test(item.normalizedStatus) ? "elevated" : "focused",
                            gradientSeed: snapshot.visualSeed,
                            continuityRailOffset: Math.min(1, index / 8),
                            orchestrationPressureTone: /failed|blocked|error/.test(item.normalizedStatus) ? "urgent" : unresolvedCount > 0 ? "watch" : "steady",
                            temporalResilience: temporalMemory.resilience === "strong" || temporalMemory.resilience === "moderate" ? "stable" : temporalMemory.resilience === "fragile" ? "recovering" : "volatile",
                            graphStressIntensity: Math.min(1, (deckGraph.dependencies.length + deckGraph.traversal.blockers.length) / 10),
                          },
                          capturedAt: new Date().toISOString(),
                        }, prefersReducedMotion);
                        createWorldEntryTransition({ mode: "deck_to_world", fromWorldId: runtimeSession.activeWorldId, toWorldId: snapshot.worldId, fromRoute: runtimeSession.lastRoute, toRoute: snapshot.href, label: "deck-entry", at: new Date().toISOString() }, prefersReducedMotion);
                        persistWorldEntrySnapshot(snapshot);
                        dispatch({
                          type: "SET_CAPABILITY_CONTEXT",
                          capability: resolveCapabilityForWorld(item),
                          activeEntity: { kind: item.kind, id: item.id },
                          queuedNextAction: { kind: "open", label: "open", target: { entityKind: item.kind, entityId: item.id, href: item.href, capability: resolveCapabilityForWorld(item) } },
                          lastRoute: item.href,
                          recoveryTarget: item.href,
                        });
                        router.push(item.href);
                      }}
                      data-world-card-id={`:`}
                      className={`group relative h-[420px] w-[280px] shrink-0 snap-start overflow-hidden rounded-[2rem] border p-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 hover:-translate-y-1 ${
                        active
                          ? "border-amber-200/65 bg-[linear-gradient(180deg,rgba(38,22,36,.96),rgba(8,10,26,.98))] shadow-[0_0_65px_rgba(255,174,80,.24),0_34px_90px_rgba(0,0,0,.62)]"
                          : emphasizedCardId === `${item.kind}:${item.id}`
                            ? "border-cyan-200/70 bg-[linear-gradient(180deg,rgba(22,36,58,.96),rgba(8,10,26,.98))] shadow-[0_0_72px_rgba(56,189,248,.30),0_34px_90px_rgba(0,0,0,.62)]"
                            : "border-white/12 bg-[linear-gradient(180deg,rgba(17,20,43,.9),rgba(5,8,22,.98))] shadow-[0_28px_70px_rgba(0,0,0,.58)]"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_54%_72%,rgba(255,164,72,.64),transparent_15%),radial-gradient(circle_at_55%_82%,rgba(102,226,255,.28),transparent_28%),linear-gradient(180deg,transparent_0_38%,rgba(23,16,34,.32)_39%,rgba(4,7,19,.96)_100%)]" />
                      <div className="pointer-events-none absolute bottom-24 left-0 right-0 h-36 bg-[linear-gradient(135deg,transparent_28%,rgba(255,176,77,.28)_31%,transparent_55%),linear-gradient(40deg,rgba(255,255,255,.07)_20%,transparent_21%)]" />
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cyan-300/10 to-transparent" />

                      <div className="relative">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-amber-100/82">
                          <span>{active ? "Active" : statusTone(item.normalizedStatus)}</span>
                          <span>{active ? "Current" : `${worldKind} · ${item.sourceLabel}`}</span>
                        </div>
                        <h2 className="mt-8 line-clamp-3 text-2xl leading-tight tracking-[-0.03em] text-white">{item.title}</h2>
                        <div className="mt-7 inline-flex rounded-full bg-violet-400/18 px-4 py-2 text-sm text-violet-100">
                          {item.stageLabel}
                        </div>
                      </div>

                      <div className="absolute bottom-8 left-6 right-6">
                        <div className="mb-3 h-1 rounded-full bg-white/10">
                          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-amber-300 to-cyan-300" />
                        </div>
                        <div className="flex justify-between text-xs text-white/72">
                          <span>{active ? item.actionLabel : `${worldKind.replaceAll("_", " ")} world`} · {choreography.operatorCue.nextActionLabel ?? "Open"} · {deriveRuntimeOrchestration({ worldId: worldKind, status: item.normalizedStatus, blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [], unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0, guidedStepId: null, previousWorldId: runtimeSession.previousWorldId, lastActionLabel: runtimeSession.worldContinuity.lastAction?.label ?? null, breadcrumbs: runtimeSession.worldContinuity.breadcrumbs, composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] }, now: new Date().toISOString(), lastTransitionAt: item.updatedAt ?? null }).flowHealth}</span>
                          <span>{choreography.operatorCue.blocker ? "Blocker" : choreography.continuityCue.continuationLabel} · Chain {deckGraph.dependencies.length}/{deckGraph.traversal.blockers.length}</span>
                        </div>
                        <div className="mt-2 text-[10px] text-cyan-100/80">Age {temporalMemory.window.ageMinutes}m · Interruptions {temporalMemory.interruptions.length} · Recovery {temporalMemory.recoveries.at(-1)?.succeeded ? "stable" : temporalMemory.recoveries.length > 0 ? "retrying" : "none"} · Volatility {temporalMemory.volatility} · Stalled {temporalMemory.window.stalledMinutes}m · Stability {temporalMemory.resilience} · Last stable {temporalMemory.checkpoints.at(-1)?.label ?? "n/a"} · {temporalMemory.interruptions.length > 0 ? "Resume interrupted flow" : "Flow uninterrupted"}</div>
                      </div>
                    </button>
                  );
                })}

                {!activeWorld ? (
                  <div className="rounded-[2rem] border border-white/12 bg-white/[0.04] p-8 text-white/65">
                    No active worlds yet. Launch a campaign to create one.
                  </div>
                ) : null}

                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(75,120,255,.22),transparent_65%)] blur-sm" />
              </div>
            </aside>
          </section>

          <footer className="grid min-h-0 gap-3 border-t border-white/[0.065] pt-4 lg:grid-cols-[minmax(280px,.7fr)_1fr_300px]">
            <div className="flex items-center gap-4 rounded-[1.6rem] bg-white/[0.025] px-5 py-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-violet-400/20 text-violet-100 shadow-[0_0_28px_rgba(139,92,246,.35)]">
                ✦
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/50">Operator presence</div>
                <div className="mt-1 text-sm text-white/75">Online and synchronized.</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 rounded-[1.6rem] bg-white/[0.025] px-4 py-4">
              {[
                ["Runtime pulse", "Calm · Focused · Steady"],
                ["Continuity signal", "Stable"],
                ["Atmosphere", "Focused"],
                ["Momentum", "Building"],
              ].map(([label, value]) => (
                <div key={label} className="border-r border-white/10 px-2 last:border-r-0">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/42">{label}</div>
                  <div className="mt-3 text-sm text-cyan-100">{value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[1.6rem] bg-white/[0.025] px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/50">Operations</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["Campaigns", "/shopreel/campaigns"],
                  ["Review", "/shopreel/review"],
                  ["Library", "/shopreel/library"],
                  ["Ops", "/shopreel/operations"],
                ].map(([title, href]) => (
                  <Link key={href} href={href} className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/70 hover:bg-white/[0.07]">
                    {title}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        </main>
      </div>

      <div className="px-3 pb-2 lg:hidden">
        <OperatorRuntimeCanvas
          session={runtimeSession}
          onRecover={() => dispatch({ type: "RECOVER" })}
          onInterruptManual={() =>
            dispatch(
              buildInterruptAction({
                reason: "Manual tools requested",
                requestedSurface: "manual_operations",
                returnSurface: runtimeSession.activeSurface,
                returnState: runtimeSession.runtimeState,
                fallbackRoute: "/shopreel/operations",
              }),
            )
          }
          onRunCommand={(next) => runCommand(next)}
          context={context}
          recent={recent}
          campaignContext={campaignContext}
          onDecisionSaved={(summary) =>
            dispatch({ type: "APPLY_REVIEW_DECISION", decisionSummary: summary, nextState: "refining_output" })
          }
          reducedMotion={prefersReducedMotion}
          chamberMemory={chamberMemory}
          compact
        />
      </div>
    </div>
  );
}
