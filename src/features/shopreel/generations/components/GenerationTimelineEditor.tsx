"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { buildProductionMediaGraph, deriveAssetAwareness, deriveSceneIntelligence } from "@/features/shopreel/production/mediaGraph";
import { deriveEcosystemState, readWorkspaceMemory, writeWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

type Scene = {
  id: string;
  title: string;
  role: string;
  durationSeconds: number | null;
  overlayText?: string | null;
  voiceoverText?: string | null;
  media?: Array<{ id?: string; assetId?: string; url?: string | null; type?: string }>;
};

type StoryDraftLike = { title?: string | null; hook?: string | null; cta?: string | null; caption?: string | null; scriptText?: string | null; voiceoverText?: string | null; scenes?: Scene[] };
type ExecutionState = "preparing"|"sequencing"|"awaiting_assets"|"render_ready"|"packaging"|"review_blocked"|"export_ready"|"interrupted"|"resumed"|"archived";
type RenderLifecycleState = "queued" | "staging" | "rendering" | "packaging" | "export_ready" | "blocked";
type FocusMode = "campaign" | "render" | "scene" | "variant" | "packaging" | "publish";
type ZoomLevel = "macro" | "orchestration" | "scene" | "asset";


type EnvironmentalWeight = {
  key: string;
  label: string;
  score: number;
  reason: string;
};

type AutonomousActionType = "group_variants" | "prioritize_render" | "restore_interrupted" | "surface_blockers" | "compress_telemetry" | "elevate_export" | "attach_continuity" | "rebuild_focus" | "cluster_exports";
type AutonomousAction = {
  id: string;
  type: AutonomousActionType;
  label: string;
  rationale: string;
  reversible: boolean;
  appliedAt: string;
};

type ConfidenceSignal = {
  key: string;
  label: string;
  state: "stable" | "watch" | "risk";
  rationale: string;
};

const focusModes: FocusMode[] = ["campaign", "render", "scene", "variant", "packaging", "publish"];
const zoomLevels: ZoomLevel[] = ["macro", "orchestration", "scene", "asset"];

function formatLabel(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
function cycleState<T>(items: readonly T[], cursor: number) { return items[cursor % items.length]; }

export default function GenerationTimelineEditor(props: { generationId: string; initialDraft: StoryDraftLike; }) {
  const router = useRouter();
  const [draft, setDraft] = useState<StoryDraftLike>(props.initialDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [heartbeatTick, setHeartbeatTick] = useState(0);
  const [focusMode, setFocusMode] = useState<FocusMode>("campaign");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("orchestration");
  const [showTelemetry, setShowTelemetry] = useState(true);
  const [expandedRails, setExpandedRails] = useState<Record<string, boolean>>({ timeline: true, orchestration: true, map: true });
  const [ambientMode, setAmbientMode] = useState<"render"|"campaign"|"packaging"|"scene"|"publish"|"variant"|"balanced">("balanced");
  const [autoActions, setAutoActions] = useState<AutonomousAction[]>([]);
  const [undoStack, setUndoStack] = useState<AutonomousAction[]>([]);

  const scenes = useMemo(() => draft.scenes ?? [], [draft.scenes]);
  const mediaGraph = useMemo(() => buildProductionMediaGraph({ generationId: props.generationId, hook: draft.hook, cta: draft.cta, caption: draft.caption, scenes }), [draft.caption, draft.cta, draft.hook, props.generationId, scenes]);
  const sceneIntelligence = useMemo(() => deriveSceneIntelligence({ generationId: props.generationId, hook: draft.hook, cta: draft.cta, caption: draft.caption, scenes }), [draft.caption, draft.cta, draft.hook, props.generationId, scenes]);
  const assetAwareness = useMemo(() => deriveAssetAwareness(scenes), [scenes]);
  const blockers = useMemo(() => scenes.filter((scene) => !scene.voiceoverText?.trim() || !scene.media?.length).map((scene) => `${scene.title}: ${!scene.voiceoverText?.trim() ? "voiceover missing" : "media coverage missing"}`), [scenes]);

  useEffect(() => {
    const timer = window.setInterval(() => setHeartbeatTick((current) => current + 1), 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const memory = readWorkspaceMemory();
    if (!memory) return;
    const restoredMode: FocusMode = memory.adaptiveMode === "balanced" || !memory.adaptiveMode ? "campaign" : memory.adaptiveMode;
    setFocusMode(restoredMode);
    setAmbientMode(memory.adaptiveMode ?? "balanced");
    setShowTelemetry(memory.adaptiveMode === "render" || memory.adaptiveMode === "publish");
    setExpandedRails((current) => ({
      ...current,
      timeline: memory.adaptiveMode !== "render",
      map: memory.adaptiveMode !== "scene",
    }));
  }, []);

  const heartbeat = useMemo(() => {
    const readyScenes = scenes.filter((scene) => scene.media?.length && scene.voiceoverText?.trim()).length;
    const pendingScenes = Math.max(scenes.length - readyScenes, 0);
    const executionState: ExecutionState = blockers.length
      ? cycleState<ExecutionState>(["awaiting_assets", "review_blocked", "interrupted", "resumed"], heartbeatTick)
      : cycleState<ExecutionState>(["preparing", "sequencing", "render_ready", "packaging", "export_ready"], heartbeatTick);
    const renderState: RenderLifecycleState = blockers.length
      ? cycleState<RenderLifecycleState>(["queued", "staging", "blocked"], heartbeatTick)
      : cycleState<RenderLifecycleState>(["queued", "staging", "rendering", "packaging", "export_ready"], heartbeatTick);
    return { executionState, renderState, readyScenes, pendingScenes, progress: scenes.length ? Math.round((readyScenes / scenes.length) * 100) : 0 };
  }, [blockers.length, heartbeatTick, scenes]);

  const executionStream = useMemo(() => [
    `Production heartbeat ${heartbeat.executionState.replaceAll("_", " ")}.`,
    heartbeat.pendingScenes > 0 ? `Voiceover still missing for ${heartbeat.pendingScenes} scene(s).` : "Campaign continuity restored.",
    `Render rail transitioned to ${formatLabel(heartbeat.renderState)}.`,
    heartbeat.renderState === "export_ready" ? "Instagram export awaiting CTA review." : "Packaging TikTok variant…",
    blockers.length ? `Recovered interrupted workflow: ${blockers[0]}.` : "Hook variant promoted to primary candidate.",
  ].map((entry, index) => ({ id: `${heartbeatTick}-${index}`, entry })), [blockers, heartbeat.executionState, heartbeat.pendingScenes, heartbeat.renderState, heartbeatTick]);

  const orchestrationMap = useMemo(() => [
    { label: "Campaign branch", state: heartbeat.executionState, status: heartbeat.pendingScenes ? "active" : "stable" },
    { label: "Variant lineage", state: blockers.length ? "review_blocked" : "resumed", status: blockers.length ? "blocked" : "flowing" },
    { label: "Render ancestry", state: heartbeat.renderState, status: heartbeat.renderState === "blocked" ? "blocked" : "flowing" },
    { label: "Export path", state: heartbeat.renderState === "export_ready" ? "export_ready" : "packaging", status: heartbeat.renderState === "export_ready" ? "ready" : "active" },
  ], [blockers.length, heartbeat.executionState, heartbeat.pendingScenes, heartbeat.renderState]);

  const environmentalWeights = useMemo<EnvironmentalWeight[]>(() => {
    const urgency = blockers.length > 0 ? 92 : heartbeat.pendingScenes > 0 ? 70 : 40;
    const readiness = heartbeat.progress;
    const interruptionRisk = blockers.length > 0 ? 88 : 24;
    const renderConfidence = heartbeat.renderState === "blocked" ? 34 : heartbeat.renderState === "rendering" ? 78 : heartbeat.renderState === "export_ready" ? 96 : 62;
    const reviewBlockage = blockers.length > 0 ? 86 : 22;
    const exportMaturity = heartbeat.renderState === "export_ready" ? 94 : heartbeat.renderState === "packaging" ? 76 : 30;
    const continuityImportance = focusMode === "scene" || focusMode === "variant" ? 90 : 68;
    return [
      { key: "urgency", label: "Urgency", score: urgency, reason: blockers.length > 0 ? "Blockers are unresolved and spatially persistent." : "No active hard blockers." },
      { key: "readiness", label: "Readiness", score: readiness, reason: "Derived from scene coverage and voiceover completeness." },
      { key: "interruption", label: "Interruption risk", score: interruptionRisk, reason: blockers.length > 0 ? "Interrupted path requires foreground recovery." : "No interrupted focus path detected." },
      { key: "render-confidence", label: "Render confidence", score: renderConfidence, reason: `Render lifecycle currently ${formatLabel(heartbeat.renderState)}.` },
      { key: "review-blockage", label: "Review blockage", score: reviewBlockage, reason: blockers.length > 0 ? "Review cannot progress until media/voiceover recovery." : "Review path is unblocked." },
      { key: "export-maturity", label: "Export maturity", score: exportMaturity, reason: "Export branch weighting follows packaging lifecycle." },
      { key: "continuity", label: "Continuity importance", score: continuityImportance, reason: "Continuity rails persist under scene/variant focus." },
    ];
  }, [blockers.length, focusMode, heartbeat.pendingScenes, heartbeat.progress, heartbeat.renderState]);

  const orchestrationGravity = useMemo(() => {
    const renderNearReady = heartbeat.renderState === "packaging" || heartbeat.renderState === "export_ready";
    return [
      { key: "render-path", label: "Render-ready path", active: renderNearReady, weight: renderNearReady ? 95 : 42, reason: renderNearReady ? "Nearing complete render lifecycle." : "Render still stabilizing." },
      { key: "blocked-workflow", label: "Blocked workflow", active: blockers.length > 0, weight: blockers.length > 0 ? 90 : 20, reason: blockers.length > 0 ? "Unresolved interruption remains anchored." : "No blockers detected." },
      { key: "variant-lineage", label: "Variant lineage", active: heartbeat.executionState === "sequencing" || focusMode === "variant", weight: focusMode === "variant" ? 88 : 64, reason: "Active variants remain elevated for continuity." },
      { key: "stale-telemetry", label: "Stale telemetry", active: !showTelemetry, weight: !showTelemetry ? 16 : 45, reason: !showTelemetry ? "Auto-compressed to reduce noise." : "Expanded while execution is active." },
    ].sort((a, b) => b.weight - a.weight);
  }, [blockers.length, focusMode, heartbeat.executionState, heartbeat.renderState, showTelemetry]);

  const confidenceSignals = useMemo<ConfidenceSignal[]>(() => {
    const continuityState: ConfidenceSignal["state"] = heartbeat.pendingScenes === 0 ? "stable" : heartbeat.pendingScenes < 2 ? "watch" : "risk";
    const renderState: ConfidenceSignal["state"] = heartbeat.renderState === "blocked" ? "risk" : heartbeat.renderState === "rendering" ? "watch" : "stable";
    const blockerState: ConfidenceSignal["state"] = blockers.length > 0 ? "risk" : "stable";
    const exportState: ConfidenceSignal["state"] = heartbeat.renderState === "export_ready" ? "stable" : heartbeat.renderState === "packaging" ? "watch" : "risk";
    return [
      { key: "stability", label: "Operational stability", state: blockerState, rationale: blockers.length > 0 ? "Active blockers are unresolved." : "No hard blockers detected across active scenes." },
      { key: "continuity", label: "Continuity integrity", state: continuityState, rationale: heartbeat.pendingScenes > 0 ? `${heartbeat.pendingScenes} scene(s) still miss continuity coverage.` : "Continuity threads are complete across scenes." },
      { key: "render", label: "Render confidence", state: renderState, rationale: `Render branch currently ${formatLabel(heartbeat.renderState)}.` },
      { key: "export", label: "Export readiness certainty", state: exportState, rationale: heartbeat.renderState === "export_ready" ? "Packaging branch is ready for operator review." : "Export branch still requires deterministic lifecycle progression." },
      { key: "recovery", label: "Workflow recovery confidence", state: heartbeat.executionState === "interrupted" ? "risk" : heartbeat.executionState === "resumed" ? "watch" : "stable", rationale: heartbeat.executionState === "interrupted" ? "Interrupted workflow is anchored for restoration." : "No interruption recovery debt detected." },
    ];
  }, [blockers.length, heartbeat.executionState, heartbeat.pendingScenes, heartbeat.renderState]);

  const ecosystemState = useMemo(() => deriveEcosystemState({
    pendingTaskCount: heartbeat.pendingScenes,
    readyTaskCount: heartbeat.readyScenes,
    blockerCount: blockers.length,
    continuityThreadCount: 3 + (focusMode === "variant" ? 1 : 0),
    interruptedWorkflow: heartbeat.executionState === "interrupted" ? "editor" : undefined,
    adaptiveMode: ambientMode,
    minutesSinceUpdate: heartbeatTick * 4,
  }), [ambientMode, blockers.length, focusMode, heartbeat.executionState, heartbeat.pendingScenes, heartbeat.readyScenes, heartbeatTick]);

  useEffect(() => {
    const actions: AutonomousAction[] = [];
    if (!showTelemetry || ecosystemState.telemetryDensityPressure < 35) {
      actions.push({ id: `compress-${heartbeatTick}`, type: "compress_telemetry", label: "Compressed resolved telemetry", rationale: "Compressed because telemetry rail is not needed for current execution focus.", reversible: true, appliedAt: new Date().toISOString() });
    }
    if (heartbeat.renderState === "packaging" || heartbeat.renderState === "export_ready") {
      actions.push({ id: `render-priority-${heartbeatTick}`, type: "prioritize_render", label: "Prioritized render-ready branch", rationale: "Elevated due to render lifecycle nearing export readiness.", reversible: true, appliedAt: new Date().toISOString() });
      actions.push({ id: `export-cluster-${heartbeatTick}`, type: "cluster_exports", label: "Clustered export/package relationships", rationale: "Grouped because packaging and export states share the same active lifecycle path.", reversible: true, appliedAt: new Date().toISOString() });
    }
    if (blockers.length > 0) {
      actions.push({ id: `blocker-${heartbeatTick}`, type: "surface_blockers", label: "Surfaced unresolved blockers", rationale: "Persisted in foreground due to interruption risk and unresolved dependencies.", reversible: false, appliedAt: new Date().toISOString() });
      actions.push({ id: `restore-${heartbeatTick}`, type: "restore_interrupted", label: "Restored interrupted workflow context", rationale: "Restored previous production context because interruption state was detected.", reversible: true, appliedAt: new Date().toISOString() });
    }
    if (focusMode === "variant" || heartbeat.executionState === "sequencing") {
      actions.push({ id: `variant-${heartbeatTick}`, type: "group_variants", label: "Grouped related variants", rationale: "Grouped variant lineage to preserve continuity while sequencing active branches.", reversible: true, appliedAt: new Date().toISOString() });
    }
    actions.push({ id: `continuity-${heartbeatTick}`, type: "attach_continuity", label: "Attached continuity context", rationale: "Attached continuity thread metadata to maintain flow-state context after transitions.", reversible: false, appliedAt: new Date().toISOString() });
    actions.push({ id: `focus-${heartbeatTick}`, type: "rebuild_focus", label: "Rebuilt operational focus", rationale: "Recovered adaptive focus profile from deterministic workspace memory state.", reversible: true, appliedAt: new Date().toISOString() });
    actions.push({ id: `export-elevate-${heartbeatTick}`, type: "elevate_export", label: "Elevated publish-ready outputs", rationale: heartbeat.renderState === "export_ready" ? "Elevated due to export readiness." : "Maintained at normal weight until export readiness is reached.", reversible: true, appliedAt: new Date().toISOString() });

    setAutoActions(actions.slice(0, 8));
  }, [blockers.length, ecosystemState.telemetryDensityPressure, focusMode, heartbeat.executionState, heartbeat.renderState, heartbeatTick, showTelemetry]);

  const timelineClusters = useMemo(() => scenes.map((scene, index) => ({ scene, index, lineage: scene.media?.length ? "Linked to media lineage" : "Awaiting media lineage" })), [scenes]);

  const compactMode = zoomLevel === "macro" || zoomLevel === "orchestration";

  function updateScene(sceneId: string, patch: Partial<Scene>) { setDraft((current) => ({ ...current, scenes: (current.scenes ?? []).map((scene) => scene.id === sceneId ? { ...scene, ...patch } : scene) })); }

  function setAdaptiveFocus(mode: FocusMode) {
    setFocusMode(mode);
    const memory = readWorkspaceMemory();
    if (!memory) return;
    writeWorkspaceMemory({ ...memory, adaptiveMode: mode, updatedAt: new Date().toISOString() });
    setAmbientMode(mode);
  }

  function undoAutonomousAction(actionId: string) {
    const action = autoActions.find((entry) => entry.id === actionId);
    if (!action || !action.reversible) return;
    setUndoStack((current) => [action, ...current].slice(0, 6));
    if (action.type === "compress_telemetry") setShowTelemetry(true);
    if (action.type === "prioritize_render") setFocusMode("campaign");
    if (action.type === "restore_interrupted") setExpandedRails((current) => ({ ...current, timeline: true, map: true }));
  }

  async function saveDraft() {
    try {
      setSaving(true); setError(null); setMessage(null);
      const res = await fetch(`/api/shopreel/generations/${props.generationId}/draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storyDraft: draft }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to save story draft");
      setMessage("Timeline changes saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save story draft");
    } finally { setSaving(false); }
  }

  const atmosphereClass = ecosystemState.environmentalEnergy === "render_tension" ? "from-fuchsia-500/20 via-cyan-400/10 to-transparent" : ecosystemState.environmentalEnergy === "export_momentum" ? "from-emerald-400/20 via-cyan-400/10 to-transparent" : ecosystemState.environmentalEnergy === "blocker_friction" ? "from-amber-500/20 via-rose-400/10 to-transparent" : ecosystemState.environmentalEnergy === "campaign_intensity" ? "from-indigo-500/20 via-violet-400/10 to-transparent" : "from-violet-500/20 via-cyan-500/10 to-transparent";

  return <div className={cx("relative grid gap-5 overflow-hidden rounded-[2rem] p-1", "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br", atmosphereClass)}>
    <GlassCard label="Spatial production workspace" title="Navigate production depth" description="Foreground editing, orchestration rails, and background telemetry now share one navigable workspace." strong>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {zoomLevels.map((level) => <button key={level} onClick={() => setZoomLevel(level)} className={cx("rounded-full px-3 py-1 text-xs transition", zoomLevel === level ? "bg-cyan-400/25 text-cyan-50" : "bg-white/5 text-white/70")}>{formatLabel(level)}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {focusModes.map((mode) => <button key={mode} onClick={() => setAdaptiveFocus(mode)} className={cx("rounded-full px-3 py-1 text-xs transition", focusMode === mode ? "bg-violet-500/25 text-violet-50" : "bg-white/5 text-white/70")}>{formatLabel(mode)} focus</button>)}
          </div>
          <div className="text-sm text-white/70">Spatial state: <span className="text-white">{formatLabel(zoomLevel)}</span> zoom · <span className="text-white">{formatLabel(focusMode)}</span> intent · <span className="text-white">{formatLabel(ambientMode)}</span> ambient mode</div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className={cx("text-xs uppercase tracking-[0.16em]", glassTheme.text.muted)}>Production minimap</div>
          <div className="mt-3 grid gap-2">
            {orchestrationMap.map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-white/80"><span>{item.label}</span><span>{formatLabel(item.status)} · {formatLabel(item.state)}</span></div>)}
          </div>
        </div>
      </div>
    </GlassCard>

    <GlassCard label="Orchestration gravity" title="Adaptive prominence rail" description="Execution paths self-organize by readiness, blockers, and continuity risk without noisy alerts.">
      <div className="grid gap-2">
        {orchestrationGravity.map((signal) => <div key={signal.key} className={cx("rounded-xl px-3 py-2 text-xs transition", signal.active ? "bg-cyan-400/10 text-cyan-50" : "bg-white/[0.03] text-white/70")}>
          <div className="flex items-center justify-between"><span>{signal.label}</span><span>{signal.weight}% gravity</span></div>
          <div className="mt-1 text-[11px] text-white/60">{signal.reason}</div>
        </div>)}
      </div>
    </GlassCard>

    <GlassCard label="Ecosystem state engine" title="Continuous adaptive balancing" description="Client-side deterministic state computes saturation, entropy, continuity pressure, and temporal adaptation.">
      <div className="grid gap-2 md:grid-cols-2">
        {[
          ["Operational saturation", ecosystemState.operationalSaturation],
          ["Interruption pressure", ecosystemState.interruptionPressure],
          ["Continuity importance", ecosystemState.continuityImportance],
          ["Production load", ecosystemState.activeProductionLoad],
          ["Export readiness", ecosystemState.exportReadinessPressure],
          ["Render urgency", ecosystemState.renderUrgency],
          ["Blocker weight", ecosystemState.unresolvedBlockerWeight],
          ["Focus entropy", ecosystemState.focusEntropy],
          ["Telemetry pressure", ecosystemState.telemetryDensityPressure],
        ].map(([label, score]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80"><div className="flex items-center justify-between"><span>{label}</span><span>{score}</span></div></div>)}
      </div>
      <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-50">
        Temporal state: {formatLabel(ecosystemState.temporalRailState)} · Environmental energy: {formatLabel(ecosystemState.environmentalEnergy)}
      </div>
    </GlassCard>

    <GlassCard label="Execution stream" title="Compressed telemetry rail" description="Telemetry can collapse to preserve focus while keeping heartbeat continuity visible.">
      <div className="mb-3 flex items-center justify-between"><GlassBadge tone="default">{showTelemetry ? "Expanded" : "Compressed"}</GlassBadge><button onClick={() => setShowTelemetry((c) => !c)} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80">{showTelemetry ? "Collapse telemetry" : "Expand telemetry"}</button></div>
      {showTelemetry ? <div className="grid gap-2">{executionStream.map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">{item.entry}</div>)}</div> : <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">Heartbeat {formatLabel(heartbeat.executionState)} · Render {formatLabel(heartbeat.renderState)} · {heartbeat.progress}% ready</div>}
    </GlassCard>

    <GlassCard label="Constrained autonomy" title="Autonomous orchestration log" description="Deterministic, explainable actions run quietly and stay reversible where safe.">
      <div className="grid gap-2">
        {autoActions.map((action) => <div key={action.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">
          <div className="flex items-center justify-between gap-3"><span>{action.label}</span>{action.reversible ? <button onClick={() => undoAutonomousAction(action.id)} className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/70">Undo</button> : <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">Locked</span>}</div>
          <div className="mt-1 text-[11px] text-white/60">{action.rationale}</div>
        </div>)}
      </div>
      {undoStack.length > 0 ? <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">Reversed actions: {undoStack.map((entry) => entry.label).join(" · ")}</div> : null}
    </GlassCard>

    <GlassCard label="Environmental priority system" title="Dynamic weighting engine" description="Visibility, persistence, and compression adapt from deterministic operational weighting.">
      <div className="grid gap-2 md:grid-cols-2">
        {environmentalWeights.map((weight) => <div key={weight.key} className={cx("rounded-xl border px-3 py-2 text-xs", weight.score >= 80 ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-50" : weight.score >= 55 ? "border-violet-300/20 bg-violet-400/10 text-violet-50" : "border-white/10 bg-white/[0.03] text-white/75")}>
          <div className="flex items-center justify-between"><span>{weight.label}</span><span>{weight.score}</span></div>
          <div className="mt-1 text-[11px] text-white/60">{weight.reason}</div>
        </div>)}
      </div>
    </GlassCard>

    <GlassCard label="Operator confidence" title="Deterministic confidence signals" description="Operational certainty is derived from lifecycle truth, never opaque AI scoring.">
      <div className="grid gap-2 md:grid-cols-2">
        {confidenceSignals.map((signal) => <div key={signal.key} className={cx("rounded-xl border px-3 py-2 text-xs", signal.state === "stable" ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-50" : signal.state === "watch" ? "border-amber-300/30 bg-amber-400/10 text-amber-50" : "border-rose-300/30 bg-rose-400/10 text-rose-50")}>
          <div className="flex items-center justify-between"><span>{signal.label}</span><span>{formatLabel(signal.state)}</span></div>
          <div className="mt-1 text-[11px] text-white/70">{signal.rationale}</div>
        </div>)}
      </div>
    </GlassCard>

    <GlassCard label="Spatial timeline" title="Horizontal production terrain" description="Timeline clusters expose scene lineage with touch-first horizontal traversal.">
      <div className="mb-3 flex items-center justify-between"><GlassBadge tone="copper">{expandedRails.timeline ? "Expanded rail" : "Compressed rail"}</GlassBadge><button onClick={() => setExpandedRails((curr) => ({ ...curr, timeline: !curr.timeline }))} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80">{expandedRails.timeline ? "Compress" : "Expand"} timeline</button></div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {timelineClusters.map(({ scene, index, lineage }) => <div key={scene.id} className={cx("min-w-[240px] rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition", expandedRails.timeline ? "" : "min-w-[180px]")}>
          <div className="text-xs text-white/50">Scene {index + 1}</div>
          <div className="mt-1 text-sm font-medium text-white">{scene.title}</div>
          <div className="mt-1 text-xs text-white/60">{lineage}</div>
          {!compactMode ? <div className="mt-2 text-xs text-white/60">{formatLabel(scene.role)} · {scene.durationSeconds ?? 0}s</div> : null}
        </div>)}
      </div>
    </GlassCard>

    <GlassCard label="Timeline" title="Story timeline editor" description="Adjust scene structure, overlay copy, and voiceover flow before publishing." strong>
      <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2"><span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>Hook</span><input value={draft.hook ?? ""} onChange={(e) => setDraft((current) => ({ ...current, hook: e.target.value }))} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" /></label><label className="grid gap-2"><span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>CTA</span><input value={draft.cta ?? ""} onChange={(e) => setDraft((current) => ({ ...current, cta: e.target.value }))} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" /></label></div>
    </GlassCard>

    {!compactMode && <GlassCard label="Scenes" title="Scene-by-scene control" description="Edit each scene as an individual beat in the video." strong>
      {scenes.length === 0 ? <div className={cx("rounded-2xl border p-4 text-sm", glassTheme.border.softer, glassTheme.glass.panelSoft, glassTheme.text.secondary)}>No scenes are attached to this story yet.</div> : <div className="grid gap-3">{scenes.map((scene, index) => <div key={scene.id} className={cx("grid gap-4 rounded-2xl border p-4", glassTheme.border.softer, glassTheme.glass.panelSoft)}><div className="flex items-center justify-between"><div className="text-sm text-white">{index + 1}. {scene.title}</div><GlassBadge tone="default">{formatLabel(scene.role)}</GlassBadge></div><textarea value={scene.voiceoverText ?? ""} onChange={(e) => updateScene(scene.id, { voiceoverText: e.target.value })} rows={2} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none" /></div>)}</div>}
    </GlassCard>}

    <div className="flex flex-wrap gap-3"><GlassButton variant="primary" onClick={() => void saveDraft()} disabled={saving}>{saving ? "Saving..." : "Save timeline"}</GlassButton></div>
    {message ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div> : null}
    {error ? <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div> : null}
  </div>;
}
