"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AiCommandInput, interpretCommand } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import { readWorkspaceMemory, writeWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { deriveEcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";
import { deriveOperatorAdaptation, readOperatorBehaviorMemory, recordOperatorBehaviorEvent } from "@/features/shopreel/ui/system/operatorBehaviorAdaptation";
import { deriveProductionIntuition } from "@/features/shopreel/ui/system/productionIntuition";
import { deriveOperatorRhythmSnapshot, recordOperatorRhythmEvent, reorderSuggestionsByRhythm } from "@/features/shopreel/ui/system/operatorRhythm";
import { deriveStrategicAdaptation, evolveStrategicOperationalMemory, readStrategicOperationalMemory } from "@/features/shopreel/ui/system/strategicAdaptation";
import { deriveTransitionSnapshot } from "@/features/shopreel/ui/system/transitionEngine";
import { resolveRouteFromPrompt } from "@/features/shopreel/ui/system/shopReelRouteRegistry";
import { classifyCommandInputIntent } from "@/features/shopreel/ui/system/commandInputIntent";
import { createCampaignCommandHandoff } from "@/features/shopreel/ui/system/campaignCommandHandoff";

const routeCommandSuggestions: Array<{ test: (path: string) => boolean; examples: string[] }> = [
  { test: (path) => path.startsWith("/shopreel/render"), examples: ["show failed renders", "package completed jobs", "open latest export"] },
  { test: (path) => path.startsWith("/shopreel/campaign"), examples: ["show PayProof performance", "continue this campaign", "generate variations"] },
  { test: (path) => path.startsWith("/shopreel/library"), examples: ["open latest upload", "start a draft from these assets", "find campaign-ready clips"] },
];

export default function GlobalCommandLauncher() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [focusLine, setFocusLine] = useState<string>("Next move: continue active production");
  const [ecosystemHint, setEcosystemHint] = useState<string>("Production pressure: stable");
  const pathname = usePathname();
  const router = useRouter();
  const interpreted = interpretCommand(value);
  const continuity = useGlobalEnvironmentContinuity();
  const operatorAdaptation = useMemo(() => deriveOperatorAdaptation(readOperatorBehaviorMemory(), continuity), [continuity]);
  const intuition = useMemo(() => deriveProductionIntuition({
    operator: readOperatorBehaviorMemory(),
    continuity,
    evolution: continuity.continuousEvolution,
    memory: readWorkspaceMemory(),
    routePathname: pathname,
  }), [continuity, pathname]);
  const mode = continuity.adaptiveAtmosphere?.mode;
  const rhythm = useMemo(() => deriveOperatorRhythmSnapshot(), [open, pathname, history.length]);
  const strategic = useMemo(() => deriveStrategicAdaptation({ workspace: readWorkspaceMemory(), operator: readOperatorBehaviorMemory(), continuity, strategicMemory: readStrategicOperationalMemory() }), [continuity, pathname, history.length]);

  const contextualExamples = useMemo(() => {
    if (intuition.likelyNextMove === "package_or_publish" || intuition.likelyNextMove === "prepare_export") return ["package ready assets", "open publish queue", "schedule latest export"];
    if (intuition.likelyNextMove === "inspect_render_queue" || intuition.likelyNextMove === "resolve_render_blocker") return ["show render queue blockers", "open failed renders", "stabilize render continuity"];
    if (intuition.likelyNextMove === "continue_campaign") return ["open active campaign", "continue campaign sequencing", "review campaign readiness"];
    if (intuition.likelyNextMove === "restore_continuity" || intuition.likelyNextMove === "resume_previous_work") return ["restore previous route", "resume interrupted workflow", "continue latest thread"];
    if (operatorAdaptation.priorityBias === "export") return ["package ready assets", "open publish queue", "review export blockers"];
    if (operatorAdaptation.priorityBias === "render") return ["show render queue blockers", "open failed renders", "stabilize render continuity"];
    if (operatorAdaptation.priorityBias === "campaign") return ["open active campaign", "continue campaign sequencing", "review campaign readiness"];

    if (mode === "export_momentum") return ["package ready assets", "open publish queue", "schedule latest export"];
    if (mode === "render_pressure") return ["show render queue blockers", "open failed renders", "prioritize recovery lane"];
    if (mode === "recovery") return ["continue recovery corridor", "resume interrupted workflow", "confirm continuity restored"];
    if (mode === "dormant") return ["resume latest work", "open most recent draft", "wake continuity threads"];
    if (mode === "fractured") return ["stabilize continuity", "restore previous route", "audit unresolved blockers"];
    const routeMatch = routeCommandSuggestions.find((x) => x.test(pathname));
    return routeMatch?.examples ?? ["continue what we were working on", "open latest draft", "review render status"];
  }, [mode, pathname, operatorAdaptation.priorityBias, intuition.likelyNextMove]);
  const rhythmExamples = useMemo(() => reorderSuggestionsByRhythm(contextualExamples, rhythm), [contextualExamples, rhythm]);
  const strategyExamples = useMemo(() => strategic.commandOrderingBias === "export" ? ["package ready assets", "open publish queue", "schedule latest export"] : strategic.commandOrderingBias === "render" ? ["show render queue blockers", "open failed renders", "stabilize render continuity"] : strategic.commandOrderingBias === "recovery" ? ["continue recovery corridor", "restore previous route", "resume interrupted workflow"] : rhythmExamples, [rhythmExamples, strategic.commandOrderingBias]);

  useEffect(() => {
    const memory = readWorkspaceMemory();
    if (!memory) return;
    setHistory(memory.intentHistory);
    const snapshot = deriveEcosystemStateSnapshot(memory);
    setEcosystemHint(`Production pressure: ${snapshot.operationalPressure} · Continuity: ${snapshot.continuityHealth}`);
    setFocusLine(`Next move: ${snapshot.suggestedSurfaceAction}`);
  }, [open, continuity.adaptiveAtmosphere?.activeFocusLabel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = () => {
    const decision = resolveRouteFromPrompt(value, readWorkspaceMemory()?.lastRoute);
    const commandIntent = classifyCommandInputIntent(value);
    let selectedRoute = decision.route;
    let handoffMethod: "none" | "session_storage" = "none";
    let handoffId: string | null = null;
    if (commandIntent === "create_campaign") {
      const handoff = createCampaignCommandHandoff({ prompt: value.trim(), source: "global_command" });
      selectedRoute = `/shopreel/campaigns/new?mode=create&handoff=${encodeURIComponent(handoff.id)}`;
      handoffMethod = "session_storage";
      handoffId = handoff.id;
    }
    const operatorMemory = recordOperatorBehaviorEvent({ type: "command_submitted", route: selectedRoute, intent: decision.intent });
    recordOperatorRhythmEvent({ type: "command_submitted", route: selectedRoute });
    if (/(continue|resume)/i.test(value)) recordOperatorRhythmEvent({ type: "workflow_continued", route: selectedRoute });
    if (decision.intent === "render") recordOperatorRhythmEvent({ type: "render_checked", route: selectedRoute });
    if (decision.intent === "publish") recordOperatorRhythmEvent({ type: "export_opened", route: selectedRoute });
    if (decision.intent.includes("campaign")) recordOperatorRhythmEvent({ type: "campaign_opened", route: selectedRoute });
    const nextHistory = [value, ...history].filter((x) => x.trim()).slice(0, 8);
    const transition = deriveTransitionSnapshot({
      currentRoute: pathname,
      targetRoute: selectedRoute,
      command: value,
      interpretedIntent: interpreted.intent,
      memory: readWorkspaceMemory(),
    });
    setHistory(nextHistory);
    const existing = readWorkspaceMemory();
    if (existing) {
      const nextWorkspace = {
        ...existing,
        lastCommand: value,
        lastRoute: selectedRoute,
        lastWorkflow: decision.intent as any,
        intentHistory: nextHistory,
        recentIntents: [decision.intent as any, ...existing.recentIntents].slice(0, 8),
        transitionSnapshot: transition,
        updatedAt: new Date().toISOString(),
      };
      writeWorkspaceMemory(nextWorkspace);
      evolveStrategicOperationalMemory({ workspace: nextWorkspace, operator: operatorMemory, continuity });
    }
    console.info("[ShopReelRouteTrace]", { input: value, promptLength: value.length, detectedIntent: decision.intent, selectedRoute: selectedRoute, handoffMethod, handoffId, recoveryUsed: decision.usedRecovery, staleContinuityIgnored: decision.ignoredStaleContinuity, reason: decision.reason });
    router.push(selectedRoute);
    setFocusLine(`Next move: ${transition.nextActionLabel}`);
    setEcosystemHint(`Transition: ${transition.mode} · ${transition.continuityCorridor}`);
    setOpen(false);
  };

  const proactiveHint = history.length > 0 ? `Continue: ${history[0]}` : "Start with a command: continue, render, package, or publish.";
  const prominenceClass = continuity.adaptiveAtmosphere?.hierarchy === "urgent" ? "ring-2 ring-rose-300/45" : continuity.adaptiveAtmosphere?.hierarchy === "sharp" ? "ring-2 ring-cyan-300/40" : "";
  const modePlaceholder = `Command the next move… (${operatorAdaptation.operatorMode.replaceAll("_", " ")})`;

  return (
    <>
      <button onClick={() => setOpen(true)} className={`relative z-20 inline-flex min-h-10 items-center rounded-full bg-cyan-400/15 px-3 py-2 text-xs text-cyan-50 backdrop-blur transition hover:bg-cyan-300/20 ${prominenceClass}`}>
        AI Command ⌘K
      </button>
      {open ? <div className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_50%_18%,rgba(45,212,191,0.15),transparent_42%),rgba(2,4,11,0.82)] p-3 backdrop-blur-xl sm:p-6" onClick={() => setOpen(false)}>
        <div className="mx-auto mt-10 w-full max-w-3xl rounded-[2rem] bg-[#060b19]/92 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-all sm:p-6" onClick={(e) => e.stopPropagation()}>
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-cyan-100/70">Command center · {pathname}</div>
          <AiCommandInput value={value} onChange={setValue} placeholder={modePlaceholder} className="min-h-24 text-lg" />
          <div className="mt-3 text-sm text-cyan-50/90">{interpreted.summary}</div>
          {interpreted.nextActions.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">{interpreted.nextActions.map((action) => <button key={action.label} onClick={() => router.push(action.href)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10">{action.label}</button>)}</div> : null}
          <div className="mt-2 text-xs text-cyan-100/70">{proactiveHint}</div>
          <div className="mt-1 text-xs text-cyan-200/80">{ecosystemHint}</div>
          <div className="mt-1 text-xs text-cyan-200/80">{focusLine}</div>
          <div className="mt-1 text-xs text-cyan-100/80">Likely next: {intuition.suggestedCommand} → {intuition.suggestedSurface}</div>
          <div className="mt-1 text-xs text-cyan-100/70">Rhythm: {rhythm.cadence} · Strategy: {strategic.commandOrderingBias} · Bias: {operatorAdaptation.priorityBias}</div>
          <div className="mt-3 flex flex-wrap gap-2">{strategyExamples.map((example) => <button key={example} onClick={() => setValue(example)} className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">{example}</button>)}</div>
          {history.length > 0 ? <div className="mt-4">
            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/55">Recent commands</div>
            <div className="flex flex-wrap gap-2">{history.map((item) => <button key={item} onClick={() => setValue(item)} className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-50 hover:bg-cyan-400/20">{item}</button>)}</div>
          </div> : null}
          <button disabled={!interpreted.href} onClick={run} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-500/70 to-cyan-400/70 px-4 py-3 text-sm text-white disabled:opacity-40">
            Execute command
          </button>
        </div>
      </div> : null}
    </>
  );
}
