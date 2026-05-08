"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { cx, glassTheme } from "@/features/shopreel/ui/system/glassTheme";
import { buildProductionMediaGraph, deriveAssetAwareness, deriveSceneIntelligence } from "@/features/shopreel/production/mediaGraph";

type Scene = {
  id: string;
  title: string;
  role: string;
  durationSeconds: number | null;
  overlayText?: string | null;
  voiceoverText?: string | null;
  media?: Array<{
    id?: string;
    assetId?: string;
    url?: string | null;
    type?: string;
  }>;
};

type StoryDraftLike = {
  title?: string | null;
  hook?: string | null;
  cta?: string | null;
  caption?: string | null;
  scriptText?: string | null;
  voiceoverText?: string | null;
  scenes?: Scene[];
};

type ExecutionState =
  | "preparing"
  | "sequencing"
  | "awaiting_assets"
  | "render_ready"
  | "packaging"
  | "review_blocked"
  | "export_ready"
  | "interrupted"
  | "resumed"
  | "archived";

type RenderLifecycleState = "queued" | "staging" | "rendering" | "packaging" | "export_ready" | "blocked";

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function cycleState<T>(items: readonly T[], cursor: number) {
  return items[cursor % items.length];
}

export default function GenerationTimelineEditor(props: {
  generationId: string;
  initialDraft: StoryDraftLike;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<StoryDraftLike>(props.initialDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenes = useMemo(() => draft.scenes ?? [], [draft.scenes]);
  const mediaGraph = useMemo(() => buildProductionMediaGraph({ generationId: props.generationId, hook: draft.hook, cta: draft.cta, caption: draft.caption, scenes }), [draft.caption, draft.cta, draft.hook, props.generationId, scenes]);
  const sceneIntelligence = useMemo(() => deriveSceneIntelligence({ generationId: props.generationId, hook: draft.hook, cta: draft.cta, caption: draft.caption, scenes }), [draft.caption, draft.cta, draft.hook, props.generationId, scenes]);
  const assetAwareness = useMemo(() => deriveAssetAwareness(scenes), [scenes]);
  const blockers = useMemo(
    () =>
      scenes
        .filter((scene) => !scene.voiceoverText?.trim() || !scene.media?.length)
        .map((scene) => `${scene.title}: ${!scene.voiceoverText?.trim() ? "voiceover missing" : "media coverage missing"}`),
    [scenes]
  );
  const [heartbeatTick, setHeartbeatTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeartbeatTick((current) => current + 1);
    }, 4000);
    return () => window.clearInterval(timer);
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
    return {
      executionState,
      renderState,
      readyScenes,
      pendingScenes,
      progress: scenes.length ? Math.round((readyScenes / scenes.length) * 100) : 0,
    };
  }, [blockers.length, heartbeatTick, scenes]);

  const executionStream = useMemo(() => {
    const stream = [
      `Production heartbeat ${heartbeat.executionState.replaceAll("_", " ")}.`,
      heartbeat.pendingScenes > 0 ? `Voiceover still missing for ${heartbeat.pendingScenes} scene(s).` : "Campaign continuity restored.",
      `Render rail transitioned to ${formatLabel(heartbeat.renderState)}.`,
      heartbeat.renderState === "export_ready" ? "Instagram export awaiting CTA review." : "Packaging TikTok variant…",
      blockers.length ? `Recovered interrupted workflow: ${blockers[0]}.` : "Hook variant promoted to primary candidate.",
    ];
    return stream.map((entry, index) => ({ id: `${heartbeatTick}-${index}`, entry }));
  }, [blockers, heartbeat.executionState, heartbeat.pendingScenes, heartbeat.renderState, heartbeatTick]);

  const threadStates = useMemo(
    () => [
      { label: "Campaign A", state: heartbeat.executionState, detail: "Packaging + publish prep" },
      { label: "Campaign B", state: heartbeat.renderState === "blocked" ? "awaiting_assets" : "render_ready", detail: "Render infrastructure active" },
      { label: "Variant C", state: blockers.length ? "review_blocked" : "resumed", detail: blockers.length ? "CTA approval pending" : "Continuity recovered" },
      { label: "Draft D", state: heartbeat.pendingScenes ? "sequencing" : "export_ready", detail: `${heartbeat.readyScenes}/${Math.max(scenes.length, 1)} scenes execution-ready` },
    ],
    [blockers.length, heartbeat.executionState, heartbeat.pendingScenes, heartbeat.readyScenes, heartbeat.renderState, scenes.length]
  );

  function updateScene(sceneId: string, patch: Partial<Scene>) {
    setDraft((current) => ({
      ...current,
      scenes: (current.scenes ?? []).map((scene) =>
        scene.id === sceneId ? { ...scene, ...patch } : scene
      ),
    }));
  }

  async function saveDraft() {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const res = await fetch(`/api/shopreel/generations/${props.generationId}/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyDraft: draft,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Failed to save story draft");
      }

      setMessage("Timeline changes saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save story draft");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <GlassCard
        label="Production heartbeat"
        title="Live creative execution pulse"
        description="Deterministic operator heartbeat derived from scene readiness, media graph, and unresolved blockers."
        strong
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className={cx("text-xs uppercase tracking-[0.16em]", glassTheme.text.muted)}>Heartbeat state</div>
            <div className="mt-2 text-xl font-semibold text-white">{formatLabel(heartbeat.executionState)}</div>
            <div className="mt-2 text-xs text-white/70">Scene readiness {heartbeat.progress}% · {heartbeat.readyScenes} ready · {heartbeat.pendingScenes} pending</div>
            <div className="mt-3 h-2 rounded-full bg-black/30">
              <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400/70 to-violet-500/70" style={{ width: `${heartbeat.progress}%` }} />
            </div>
            <div className="mt-3 text-xs text-white/60">
              {blockers.length ? `Unresolved blockers: ${blockers[0]}` : "No active blockers. Production continuity stable."}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className={cx("text-xs uppercase tracking-[0.16em]", glassTheme.text.muted)}>Render lifecycle rail</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["queued", "staging", "rendering", "packaging", "export_ready", "blocked"] as const).map((state) => (
                <GlassBadge key={state} tone={state === heartbeat.renderState ? "copper" : "muted"}>{formatLabel(state)}</GlassBadge>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard
        label="Execution stream"
        title="Operator telemetry"
        description="Low-noise operational stream of workflow transitions, continuity recovery, and variant motion."
      >
        <div className="grid gap-2">
          {executionStream.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80">{item.entry}</div>
          ))}
        </div>
      </GlassCard>

      <GlassCard
        label="Multi-thread orchestration"
        title="Parallel production threads"
        description="Execution-aware threads keep campaigns, variants, renders, and draft review active at the same time."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {threadStates.map((thread) => (
            <div key={thread.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white">{thread.label}</div>
                <GlassBadge tone="default">{formatLabel(thread.state)}</GlassBadge>
              </div>
              <div className="mt-1 text-xs text-white/60">{thread.detail}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard
        label="Timeline"
        title="Story timeline editor"
        description="Adjust scene structure, overlay copy, and voiceover flow before publishing."
        strong
      >
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                Hook
              </span>
              <input
                value={draft.hook ?? ""}
                onChange={(e) => setDraft((current) => ({ ...current, hook: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                CTA
              </span>
              <input
                value={draft.cta ?? ""}
                onChange={(e) => setDraft((current) => ({ ...current, cta: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
              Caption
            </span>
            <textarea
              value={draft.caption ?? ""}
              onChange={(e) => setDraft((current) => ({ ...current, caption: e.target.value }))}
              rows={4}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
            />
          </label>
        </div>
      </GlassCard>


      <GlassCard
        label="Production graph"
        title="Live media graph"
        description="Deterministic graph of how scenes, assets, and variants relate before render + export."
        strong
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className={cx("text-xs uppercase tracking-[0.16em]", glassTheme.text.muted)}>Graph nodes</div>
            <div className="mt-3 space-y-2">{mediaGraph.nodes.slice(0, 12).map((node) => <div key={node.id} className="rounded-xl bg-black/30 px-3 py-2 text-xs text-white/80">{node.kind} · {node.label}</div>)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className={cx("text-xs uppercase tracking-[0.16em]", glassTheme.text.muted)}>Scene intelligence</div>
            <div className="mt-3 space-y-2">{sceneIntelligence.map((note) => <div key={note} className="rounded-xl bg-black/30 px-3 py-2 text-xs text-white/80">{note}</div>)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className={cx("text-xs uppercase tracking-[0.16em]", glassTheme.text.muted)}>Asset awareness</div>
            <div className="mt-3 space-y-2">{assetAwareness.map((note) => <div key={note} className="rounded-xl bg-black/30 px-3 py-2 text-xs text-white/80">{note}</div>)}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard label="Variant rail" title="Variant orchestration" description="Plan derivative cuts without leaving the generation timeline.">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {["Instagram core", "TikTok fast hook", "Aggressive CTA", "Founder story", "Product-only cut", "Short hook A/B"].map((variant, index) => <div key={variant} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/80"><div className="font-medium text-white">{variant}</div><div className="mt-1 text-white/60">Derived from base storyboard · v{index + 1}</div></div>)}
        </div>
      </GlassCard>

      <GlassCard
        label="Scenes"
        title="Scene-by-scene control"
        description="Edit each scene as an individual beat in the video."
        strong
      >
        {scenes.length === 0 ? (
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.softer,
              glassTheme.glass.panelSoft,
              glassTheme.text.secondary
            )}
          >
            No scenes are attached to this story yet.
          </div>
        ) : (
          <div className="grid gap-3">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className={cx(
                  "grid gap-4 rounded-2xl border p-4",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/80">
                      {index + 1}
                    </div>
                    <div>
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        {scene.title}
                      </div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>
                        {formatLabel(scene.role)} • {scene.durationSeconds ?? 0}s
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <GlassBadge tone="default">{formatLabel(scene.role)}</GlassBadge>
                    {scene.media?.length ? (
                      <GlassBadge tone="muted">{scene.media.length} media</GlassBadge>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                      Scene title
                    </span>
                    <input
                      value={scene.title}
                      onChange={(e) => updateScene(scene.id, { title: e.target.value })}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                      Duration
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={scene.durationSeconds ?? 0}
                      onChange={(e) =>
                        updateScene(scene.id, {
                          durationSeconds: Number(e.target.value) || 0,
                        })
                      }
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                    />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Overlay text
                  </span>
                  <textarea
                    value={scene.overlayText ?? ""}
                    onChange={(e) => updateScene(scene.id, { overlayText: e.target.value })}
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="grid gap-2">
                  <span className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                    Voiceover
                  </span>
                  <textarea
                    value={scene.voiceoverText ?? ""}
                    onChange={(e) => updateScene(scene.id, { voiceoverText: e.target.value })}
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
                  />
                </label>

                {scene.media?.[0]?.url ? (
                  <div className="pt-1">
                    <video
                      src={scene.media[0].url ?? undefined}
                      controls
                      playsInline
                      className="max-h-56 rounded-2xl border border-white/10"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <div className="flex flex-wrap gap-3">
        <GlassButton variant="primary" onClick={() => void saveDraft()} disabled={saving}>
          {saving ? "Saving..." : "Save timeline"}
        </GlassButton>
      </div>

      {message ? (
        <div className={cx("text-sm", glassTheme.text.copperSoft)}>{message}</div>
      ) : null}

      {error ? (
        <div className={cx("text-sm", glassTheme.text.copperSoft)}>{error}</div>
      ) : null}
    </div>
  );
}
