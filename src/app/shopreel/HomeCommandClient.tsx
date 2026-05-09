"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AiCommandInput,
  AiIntentChip,
  AiWorkspaceStage,
  interpretCommand,
} from "@/features/shopreel/ui/system/AiCommandPrimitives";
import {
  buildPendingTasks,
  buildContinuityThreads,
  defaultCreativeContinuityMemory,
  evolveCreativeIntentSignals,
  deriveCinematicOrchestrationState,
  deriveEcosystemState,
  deriveProductionConsciousnessState,
  derivePersistentWorldState,
  readWorkspaceMemory,
  writeWorkspaceMemory,
  type WorkspaceMemory,
} from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { buildOperationalGraph, planCommandExecution } from "@/features/shopreel/ui/system/operationalGraph";
import { deriveEnvironmentReactivity } from "@/features/shopreel/ui/system/environmentReactivity";
import { deriveEnvironmentalField } from "@/features/shopreel/ui/system/environmentField";
import { deriveCognitiveState } from "@/features/shopreel/ui/system/cognitiveState";

type RecentItem = { id: string; title: string; status: string };

export default function HomeCommandClient({ recent }: { recent: RecentItem[] }) {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [assistantText, setAssistantText] = useState("Continuing session standby. Give me the next instruction and I will orchestrate the workspace.");
  const [context, setContext] = useState<WorkspaceMemory | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showRail, setShowRail] = useState(true);
  const [ambientCheckpoint, setAmbientCheckpoint] = useState<string>("Restoring operational checkpoint…");

  useEffect(() => {
    const parsed = readWorkspaceMemory();
    if (!parsed) return;
    setContext(parsed);
    setCommand(parsed.lastCommand);
    setHistory(parsed.intentHistory);
    setAmbientCheckpoint(`Restored ${parsed.lastWorkflow} context from ${new Date(parsed.updatedAt).toLocaleString()}.`);
  }, []);

  const interpreted = useMemo(() => interpretCommand(command), [command]);

  const persistContext = (route: string) => {
    const nextHistory = [command, ...(context?.intentHistory ?? [])].filter((x) => x.trim()).slice(0, 8);
    const nextIntents = [interpreted.intent, ...(context?.recentIntents ?? [])].slice(0, 8);
    const pendingTasks = buildPendingTasks(interpreted.intent);
    const blockerCount = pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length;
    const readyTaskCount = recent.filter((item) => /ready|complete|published/i.test(item.status)).length;
    const minutesSinceUpdate = context?.updatedAt ? Math.max(0, Math.floor((Date.now() - new Date(context.updatedAt).getTime()) / 60000)) : 0;
    const continuityThreads = buildContinuityThreads({
      intent: interpreted.intent,
      pendingTasks,
      interruptedWorkflow: interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow,
      lastRoute: route,
      generationId: recent[0]?.id,
      campaignId: recent.find((x) => /campaign/i.test(x.title))?.id ?? context?.lastCampaignId,
    });
    const ecosystemState = deriveEcosystemState({
      pendingTaskCount: pendingTasks.filter((task) => !task.done).length,
      readyTaskCount,
      blockerCount,
      continuityThreadCount: continuityThreads.length,
      interruptedWorkflow: interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow,
      adaptiveMode: interpreted.intent === "render" ? "render" : interpreted.intent === "campaign" ? "campaign" : interpreted.intent === "publish" ? "publish" : interpreted.intent === "latest" ? "scene" : "balanced",
      minutesSinceUpdate,
    });
    const cinematicState = deriveCinematicOrchestrationState({
      ecosystem: ecosystemState,
      minutesSinceUpdate,
      continuityThreadCount: continuityThreads.length,
      blockerCount,
      exportReadyCount: readyTaskCount,
      interrupted: Boolean(interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow),
    });

    const operationalGraph = buildOperationalGraph({
      generationId: recent[0]?.id,
      campaignId: recent.find((x) => /campaign/i.test(x.title))?.id ?? context?.lastCampaignId,
      pendingTaskCount: pendingTasks.filter((task) => !task.done).length,
      blockerCount,
      readyTaskCount,
      interrupted: Boolean(interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow),
      continuityThreadCount: continuityThreads.length,
      lastRoute: route,
    });
    const executionPlan = planCommandExecution(command, operationalGraph, route, interpreted.intent);

    const next: WorkspaceMemory = {
      lastWorkflow: interpreted.intent,
      lastCampaignId: recent.find((x) => /campaign/i.test(x.title))?.id ?? context?.lastCampaignId,
      lastRenderContextRoute: interpreted.intent === "render" ? route : context?.lastRenderContextRoute,
      lastGenerationId: recent[0]?.id,
      lastCommand: command,
      lastRoute: route,
      recentIntents: nextIntents,
      intentHistory: nextHistory,
      pendingTasks,
      interruptedWorkflow: interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow,
      adaptiveMode: interpreted.intent === "render" ? "render" : interpreted.intent === "campaign" ? "campaign" : interpreted.intent === "publish" ? "publish" : interpreted.intent === "latest" ? "scene" : "balanced",
      creativeContinuity: context?.creativeContinuity ?? defaultCreativeContinuityMemory(),
      continuityThreads: buildContinuityThreads({
        intent: interpreted.intent,
        pendingTasks,
        interruptedWorkflow: interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow,
        lastRoute: route,
        generationId: recent[0]?.id,
        campaignId: recent.find((x) => /campaign/i.test(x.title))?.id ?? context?.lastCampaignId,
      }),
      intentSignals: evolveCreativeIntentSignals(context?.creativeContinuity ?? defaultCreativeContinuityMemory()),
      ecosystemState,
      productionConsciousness: deriveProductionConsciousnessState({
        ecosystem: ecosystemState,
        cinematic: cinematicState,
        continuityThreadCount: continuityThreads.length,
        pendingTaskCount: pendingTasks.filter((task) => !task.done).length,
        readyTaskCount,
        blockerCount,
        minutesSinceUpdate,
        interrupted: Boolean(interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow),
        intentSignals: evolveCreativeIntentSignals(context?.creativeContinuity ?? defaultCreativeContinuityMemory()),
      }),
      worldState: derivePersistentWorldState({
        ecosystem: ecosystemState,
        cinematic: cinematicState,
        continuityThreadCount: continuityThreads.length,
        blockerCount,
        readyTaskCount,
        minutesSinceUpdate,
        interrupted: Boolean(interpreted.intent !== "unknown" ? interpreted.intent : context?.interruptedWorkflow),
      }),
      operationalGraph,
      lastExecutionPlan: executionPlan,
      updatedAt: new Date().toISOString(),
    };
    writeWorkspaceMemory(next);
    setContext(next);
    setHistory(nextHistory);
  };

  const runCommand = () => {
    const fallbackLatest = recent[0] ? `/shopreel/generations/${recent[0].id}` : "/shopreel/generations";
    const inferredTarget = interpreted.intent === "latest" && /continue/.test(command.toLowerCase())
      ? context?.lastRoute ?? fallbackLatest
      : interpreted.href ?? "/shopreel";
    const graph = context?.operationalGraph ?? buildOperationalGraph({
      generationId: recent[0]?.id,
      campaignId: recent.find((x) => /campaign/i.test(x.title))?.id ?? context?.lastCampaignId,
      pendingTaskCount: context?.pendingTasks.filter((task) => !task.done).length ?? 0,
      blockerCount: context?.pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length ?? 0,
      readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length,
      interrupted: Boolean(context?.interruptedWorkflow),
      continuityThreadCount: context?.continuityThreads?.length ?? 0,
      lastRoute: inferredTarget,
    });
    const executionPlan = planCommandExecution(command, graph, inferredTarget, interpreted.intent);
    const target = executionPlan.targetRoute;

    const countText = recent.length > 0 ? `I found ${recent.length} recent drafts. The newest reel was touched moments ago.` : "I couldn't find persisted activity yet, so I'll start from your command home.";
    setAssistantText(`${interpreted.summary} ${countText} Operating mode: ${executionPlan.mode.replaceAll("_", " ")}.`);
    persistContext(target);
    router.push(target);
  };



  const cinematicState = useMemo(() => {
    const minutesSinceUpdate = context?.updatedAt ? Math.max(0, Math.floor((Date.now() - new Date(context.updatedAt).getTime()) / 60000)) : 0;
    const ecosystem = context?.ecosystemState ?? deriveEcosystemState({
      pendingTaskCount: context?.pendingTasks.filter((task) => !task.done).length ?? 0,
      readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length,
      blockerCount: context?.pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length ?? 0,
      continuityThreadCount: context?.continuityThreads?.length ?? 0,
      interruptedWorkflow: context?.interruptedWorkflow,
      adaptiveMode: context?.adaptiveMode,
      minutesSinceUpdate,
    });
    return deriveCinematicOrchestrationState({
      ecosystem,
      minutesSinceUpdate,
      continuityThreadCount: context?.continuityThreads?.length ?? 0,
      blockerCount: context?.pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length ?? 0,
      exportReadyCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length,
      interrupted: Boolean(context?.interruptedWorkflow),
    });
  }, [context, recent]);

  const environmentReactivity = useMemo(() => deriveEnvironmentReactivity({
    memory: context,
    readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length,
  }), [context, recent]);


  const environmentalField = useMemo(() => deriveEnvironmentalField({
    memory: context,
    environment: environmentReactivity,
    readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length,
  }), [context, environmentReactivity, recent]);



  const cognitiveState = useMemo(() => deriveCognitiveState({
    memory: context,
    environment: environmentReactivity,
    field: environmentalField,
    readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length,
  }), [context, environmentReactivity, environmentalField, recent]);

  const cognitiveFocusLine = cognitiveState.renderAnxiety > 70
    ? "Focus: recover render blockers"
    : cognitiveState.exportIntent > 72
      ? "Focus: prepare export-ready packaging"
      : cognitiveState.recoveryIntelligence > 64
        ? "Focus: stabilize continuity and continue execution"
        : "Focus: advance active production tasks";

  const cinematicAuraClass = environmentReactivity.operationalWeather.pattern === "escalation_storm"
    ? "from-rose-500/20 via-amber-400/10 to-transparent"
    : environmentReactivity.operationalWeather.pattern === "export_surge"
      ? "from-emerald-400/20 via-cyan-400/10 to-transparent"
      : environmentReactivity.operationalWeather.pattern === "cinematic_stabilization"
        ? "from-sky-500/15 via-indigo-500/10 to-transparent"
        : cinematicState.emotionalState === "blocker_friction"
    ? "from-rose-500/20 via-amber-400/10 to-transparent"
    : cinematicState.emotionalState === "export_anticipation"
      ? "from-emerald-400/20 via-cyan-400/10 to-transparent"
      : cinematicState.emotionalState === "render_momentum"
        ? "from-fuchsia-500/20 via-cyan-500/10 to-transparent"
        : cinematicState.emotionalState === "calm_continuity"
          ? "from-sky-500/15 via-indigo-500/10 to-transparent"
          : "from-violet-500/20 via-cyan-500/10 to-transparent";

  const activityStream = [
    `Continuing ${context?.lastWorkflow ?? "new"} session`,
    ambientCheckpoint,
    recent[0] ? `Latest draft located: ${recent[0].title}` : "No latest draft persisted yet",
    `${recent.filter((item) => /ready|complete|published/i.test(item.status)).length} outputs ready for packaging`,
    `Last active workspace: ${context?.lastRoute ?? "Command Home"}`,
    context?.pendingTasks[0] ? `Next checkpoint: ${context.pendingTasks[0].label}` : "No pending checkpoints detected",
    context?.interruptedWorkflow ? `Interrupted flow detected: ${context.interruptedWorkflow}` : "No interrupted workflow",
    `Recent instruction interpreted as: ${interpreted.intent}`,
    `Adaptive mode: ${context?.adaptiveMode ?? "balanced"}`,
    `Continuity weather: ${context?.operationalGraph?.continuityWeather.pattern?.replaceAll("_", " ") ?? "calm operational atmosphere"} · intensity ${context?.operationalGraph?.continuityWeather.intensity ?? 0}`,
    `Environmental coherence ${context?.operationalGraph?.environmentalInterpretation.environmentalCoherence ?? 0} · topology stress ${context?.operationalGraph?.environmentalInterpretation.topologyStress ?? 0}`,
  ];

  const compressionClass = environmentalField.focusCompression > 58 ? "space-y-4" : environmentalField.pacing.breathingRhythm > 62 ? "space-y-7" : "space-y-6";
  const railDensityClass = environmentalField.pacing.compressionRhythm > 58 ? "space-y-1.5" : environmentalField.pacing.recoveryRhythm > 62 ? "space-y-2.5" : "space-y-2";

  return <div className={`relative pb-6 ${compressionClass}`}>
    <div className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br ${cinematicAuraClass} blur-3xl transition-all duration-700`} />
    <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-b p-5 shadow-[0_40px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl md:p-7 ${environmentalField.escalationBias > 64 ? "from-white/[0.06] to-black/[0.18]" : environmentalField.recoveryStabilization > 60 ? "from-emerald-100/[0.08] to-white/[0.02]" : "from-white/[0.07] to-white/[0.02]"}`}>
      <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-14 bottom-0 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Live command session</div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">What should the AI operating system run next?</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">This workspace is orchestration-first. Spatial rails, minimap memory, and focus-aware compression drive every move.</p>
        <p className="mt-2 text-xs text-white/60">Cinematic state: {cinematicState.emotionalState.replaceAll("_", " ")} · pacing {cinematicState.motionPacing.replaceAll("_", " ")} · compression {cinematicState.compressionLevel.replaceAll("_", " ")}</p>
        <p className="mt-2 text-xs text-white/55">Operational weather: {environmentReactivity.operationalWeather.pattern.replaceAll("_", " ")} · intensity {environmentReactivity.operationalWeather.intensity} · continuity scarring {environmentReactivity.continuityScarring}</p>
        <p className="mt-1 text-xs text-white/50">Field gravity {environmentalField.gravityWeighting} · export pull {environmentalField.exportPull} · continuity anchoring {environmentalField.continuityAnchoring} · breathing rhythm {environmentalField.pacing.breathingRhythm}</p>
        <div className={`mt-5 transition-all duration-300 ${isFocused ? "scale-[1.01]" : "scale-100"}`}>
          <AiCommandInput value={command} onChange={setCommand} placeholder="Try: show me my latest and package what is ready" className={`transition-all ${isFocused ? "min-h-40" : "min-h-28"}`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{["show me my latest", "continue what we were working on", "review + package", "show failed renders", "generate campaign variations"].map((x) => <button key={x} onClick={() => setCommand(x)} className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10">{x}</button>)}</div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setShowRail((v) => !v)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{showRail ? "Compress activity rail" : "Expand activity rail"}</button>
          <button onClick={runCommand} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className="rounded-2xl bg-gradient-to-r from-violet-500/70 to-cyan-400/70 px-5 py-3 text-sm font-medium text-white">Run orchestration</button>
          <span className="text-xs text-white/60">AI command is primary · Manual navigation is fallback</span>
        </div>
      </div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <AiWorkspaceStage title="Ambient orchestration stream" className="border-0 bg-white/[0.015] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <p className="text-sm text-cyan-50/90">{assistantText}</p>
        <div className={`mt-4 ${railDensityClass}`}>{showRail ? activityStream.map((entry) => <div key={entry} className="rounded-2xl bg-black/25 px-3 py-2 text-sm text-white/80">{entry}</div>) : <div className="rounded-2xl bg-black/25 px-3 py-2 text-sm text-white/70">Compressed rail · {activityStream[0]}</div>}</div>
        <div className="mt-3 rounded-2xl bg-black/25 px-3 py-2 text-xs text-white/75">{environmentReactivity.operationalWeather.descriptor}</div>
        <div className="mt-3 rounded-2xl bg-black/25 px-3 py-2 text-xs text-white/75">Terrain ridges {environmentalField.topology.continuityRidges} · fracture valleys {environmentalField.topology.fractureValleys} · export fronts {environmentalField.topology.exportFronts} · instability zones {environmentalField.topology.instabilityZones}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {interpreted.nextActions.map((action) => (
            <AiIntentChip key={action.href + action.label} label={action.label} href={action.href} className="px-3 py-1.5 text-[11px]" />
          ))}
        </div>
      </AiWorkspaceStage>

      <AiWorkspaceStage title="Session + creative memory" className={`border-0 bg-white/[0.015] shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${environmentReactivity.structuralInstability > 65 ? "ring-1 ring-rose-300/20" : environmentReactivity.recoveryWarmth > 65 ? "ring-1 ring-emerald-300/20" : ""}`}>
        <div className="space-y-2 text-sm text-white/75">
          <div>AI routing: deterministic local interpreter</div>
          <div>Current intent: {interpreted.intent}</div>
          <div>Last workflow: {context?.lastWorkflow ?? "none"}</div>
          <div>Last route: {context?.lastRoute ?? "none"}</div>
          <div>Creative pattern: {context?.creativeContinuity?.structurePattern ?? "hook-proof-cta"}</div>
          <div>Caption density bias: {context?.creativeContinuity?.captionDensity ?? "light"}</div>
          <div>World aging: {context?.worldState?.operationalAging ?? 0} · momentum: {context?.worldState?.momentumAcceleration ?? 0}</div>
          <div>Environmental harmony: {context?.operationalGraph?.environmentalInterpretation.operationalHarmony ?? 0} · execution confidence: {context?.operationalGraph?.environmentalInterpretation.executionConfidence ?? 0}</div>
          <div>Weather: {context?.operationalGraph?.continuityWeather.pattern?.replaceAll("_", " ") ?? "unknown"} · recovery window {context?.operationalGraph?.continuityWeather.recoveryWindow ?? 0}</div>
          <div>Rebalancing: focus shift {context?.operationalGraph?.adaptiveRebalancing.focusDensityShift ?? 0} · recovery corridor {context?.operationalGraph?.adaptiveRebalancing.recoveryCorridorWidth ?? 0}</div>
          <div>Reality blend integrity: {context?.operationalGraph?.multiRealityDepth.blendIntegrity ?? 0} · escalation reality {context?.operationalGraph?.multiRealityDepth.escalationReality ?? 0}</div>
          <div>Autonomous stabilization: {context?.worldState?.autonomousStabilizationActions?.[0]?.replaceAll("_", " ") ?? "none"}</div>
          <div>Atmospheric density: {environmentReactivity.atmosphericDensity} · focus pull: {environmentReactivity.focusPull} · dormant cooling: {environmentReactivity.dormantCooling}</div>
          <div>Recovery warmth: {environmentReactivity.recoveryWarmth} · temporal pressure: {environmentReactivity.temporalPressure} · environmental compression: {environmentReactivity.environmentalCompression}</div>
          <div>Environmental memory: instability {environmentalField.environmentalMemory.recurringInstabilityMemory} · export residue {environmentalField.environmentalMemory.exportResidue} · continuity fatigue {environmentalField.environmentalMemory.continuityFatigue} · stabilization confidence {environmentalField.environmentalMemory.stabilizationConfidence}</div>
          <div className="mt-2 rounded-xl bg-cyan-500/10 px-3 py-2 text-xs text-cyan-50/90">
            <div className="uppercase tracking-[0.14em] text-cyan-100/75">Cognitive production state</div>
            <div className="mt-1">Operational attention {cognitiveState.operationalAttention} · execution confidence {cognitiveState.executionConfidence} · continuity awareness {cognitiveState.continuityAwareness}</div>
            <div>Recovery intelligence {cognitiveState.recoveryIntelligence} · strategic focus {cognitiveState.strategicFocus} · render pressure {cognitiveState.renderAnxiety}</div>
            <div>Export intent {cognitiveState.exportIntent} · recovery confidence {cognitiveState.recoveryConfidence}</div>
            <div className="mt-1 text-cyan-100/80">{cognitiveFocusLine}</div>
          </div>
        </div>
        {context?.pendingTasks && context.pendingTasks.length > 0 ? <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/55">Pending tasks</div>
          <div className="space-y-2">{context.pendingTasks.map((task) => <Link key={task.id} href={task.route} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"><span>{task.label}</span><span className="text-cyan-100/70">{task.done ? "done" : "next"}</span></Link>)}</div>
        </div> : null}
        {context?.continuityThreads?.length ? <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/55">Continuity threads</div>
          <div className="space-y-2">{context.continuityThreads.slice(0, 4).map((thread) => <Link key={thread.id} href={thread.route} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs text-white/80 hover:bg-white/10"><span>{thread.label}</span><span className="text-cyan-100/70">{thread.status} · {thread.priority}</span></Link>)}</div>
        </div> : null}
        {context?.intentSignals ? <div className="mt-4 rounded-2xl bg-black/25 p-3 text-xs text-white/75">
          <div className="mb-1 uppercase tracking-[0.14em] text-white/50">Creative intent evolution</div>
          <div>Pacing: {context.intentSignals.pacingBias} · CTA: {context.intentSignals.ctaBias}</div>
          <div>Hook density: {context.intentSignals.hookDensityBias} · Export style: {context.intentSignals.exportStyleBias}</div>
          <div>Variant direction: {context.intentSignals.variantDirectionBias}</div>
        </div> : null}
        {context?.ecosystemState ? <div className="mt-4 rounded-2xl bg-black/25 p-3 text-xs text-white/75">
          <div className="mb-1 uppercase tracking-[0.14em] text-white/50">Adaptive ecosystem state</div>
          <div>Energy: {context.ecosystemState.environmentalEnergy.replaceAll("_", " ")} · Temporal: {context.ecosystemState.temporalRailState.replaceAll("_", " ")}</div>
          <div>Saturation: {context.ecosystemState.operationalSaturation} · Entropy: {context.ecosystemState.focusEntropy} · Telemetry: {context.ecosystemState.telemetryDensityPressure}</div>
        </div> : null}
        {context?.operationalGraph ? <div className="mt-4 rounded-2xl bg-black/25 p-3 text-xs text-white/75">
          <div className="mb-1 uppercase tracking-[0.14em] text-white/50">Operational graph</div>
          <div>Active chain depth: {context.operationalGraph.activeChain.length} · continuity pressure: {context.operationalGraph.continuityPressure} · readiness propagation: {context.operationalGraph.readinessPropagation}</div>
          <div>Recovery candidates: {context.operationalGraph.recoveryCandidates.join(", ")}</div>
          <div>Last execution mode: {context.lastExecutionPlan?.mode?.replaceAll("_", " ") ?? "default"}</div>
        </div> : null}
        {context?.productionConsciousness ? <div className="mt-4 rounded-2xl bg-black/25 p-3 text-xs text-white/75">
          <div className="mb-1 uppercase tracking-[0.14em] text-white/50">Production consciousness</div>
          <div>Awareness: ops {context.productionConsciousness.operationalAwareness} · momentum {context.productionConsciousness.momentumAwareness} · friction {context.productionConsciousness.frictionAwareness}</div>
          <div>Attention economy: blocker {context.productionConsciousness.attentionEconomy.blockerPressure} · telemetry decay {context.productionConsciousness.attentionEconomy.staleTelemetryDecay} · export focus {context.productionConsciousness.attentionEconomy.exportFocusShare}</div>
          <div>Topology: breathing {context.productionConsciousness.selfSteeringTopology.activeBreathingRoom} · compression {context.productionConsciousness.selfSteeringTopology.inactiveCompression} · stabilization {context.productionConsciousness.selfSteeringTopology.exportStabilization}</div>
          <div>Drift/recovery: coherence {context.productionConsciousness.creativeCoherenceAwareness} · recovery {context.productionConsciousness.recoveryProbability} · interruption sensitivity {context.productionConsciousness.interruptionSensitivity}</div>
        </div> : null}
        {history.length > 0 ? <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/55">Command history</div>
          <div className="flex flex-wrap gap-2">{history.map((item) => <button key={item} onClick={() => setCommand(item)} className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-50 hover:bg-cyan-400/20">{item}</button>)}</div>
        </div> : null}
      </AiWorkspaceStage>
    </section>

    <AiWorkspaceStage title="Operational workspaces" className="border-0 bg-white/[0.015]">
      {recent.length === 0 ? <div className="text-sm text-white/60">No persisted activity yet. Start by creating a draft or uploading media into Library.</div> : <div className="space-y-2">{recent.map((r) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/85">
        <div>
          <Link href={`/shopreel/generations/${r.id}`} className="block font-medium">{r.title}</Link>
          <div className="text-xs text-white/55">Status: {r.status}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/shopreel/generations/${r.id}`} className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-50">Continue work</Link>
          <Link href="/shopreel/render-queue" className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/75">Review outputs</Link>
          <Link href="/shopreel/exports" className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/75">Package & publish</Link>
        </div>
      </div>)}</div>}
    </AiWorkspaceStage>
  </div>;
}
