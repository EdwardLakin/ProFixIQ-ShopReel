import type { OperatorWorldCard } from "@/features/shopreel/operator/operatorWorlds";
import { resolveWorldFromEntityKind, resolveWorldFromPath } from "@/features/shopreel/ui/system/pageToWorldAdapter";
import { RUNTIME_WORLD_MAP, type RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { buildWorldSnapshot } from "@/features/shopreel/ui/system/worldSnapshot";

export type RuntimeWorldMood = "strategic" | "intake" | "checkpoint" | "machine" | "broadcast" | "signal" | "archive" | "recovery" | "creative";
export type RuntimeWorldBackdropSeed = "horizon" | "scanner" | "threshold" | "queue" | "control_room" | "constellation" | "vault" | "matrix" | "forge";

export type RuntimeWorldAtmosphere = {
  mood: RuntimeWorldMood;
  backdropSeed: RuntimeWorldBackdropSeed;
  atmosphereLabel: string;
  tonalClass: string;
  orbClass: string;
  gridClass: string;
};

export type RuntimeWorldVisualFrame = {
  frameClass: string;
  panelClass: string;
  transitionClass: string;
  visualSeed: string;
};

export type RuntimeWorldAction = { id: string; label: string; href: string; description?: string };
export type RuntimeWorldPanel = { title: string; summary: string; href?: string };
export type RuntimeWorldEnvironment = {
  worldId: RuntimeWorldId;
  worldKind: string;
  title: string;
  status: string;
  stageLabel: string;
  actionLabel: string;
  entityKind: string | null;
  entityId: string | null;
};

export type RuntimeWorldEntry = RuntimeWorldEnvironment & RuntimeWorldAtmosphere & RuntimeWorldVisualFrame & {
  href: string;
  primaryAction: RuntimeWorldAction | null;
  secondaryActions: RuntimeWorldAction[];
  manualSurfaceHref: string;
  nextWorldRecommendation: RuntimeWorldPanel | null;
  blockers: string[];
  unresolvedCount: number;
  objective: string;
};

const ATMOSPHERE_BY_WORLD: Record<RuntimeWorldId, Pick<RuntimeWorldAtmosphere, "mood" | "backdropSeed" | "atmosphereLabel" | "tonalClass" | "orbClass" | "gridClass">> = {
  campaign: { mood: "strategic", backdropSeed: "horizon", atmosphereLabel: "Strategic chamber", tonalClass: "from-amber-500/18 via-violet-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_20%_24%,rgba(255,184,77,.14),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(167,139,250,.16),transparent_32%)]", gridClass: "bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)]" },
  idea: { mood: "creative", backdropSeed: "forge", atmosphereLabel: "Discovery horizon", tonalClass: "from-violet-500/20 via-cyan-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_18%_18%,rgba(99,102,241,.22),transparent_30%),radial-gradient(circle_at_72%_12%,rgba(34,211,238,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(255,255,255,.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.018)_1px,transparent_1px)]" },
  upload: { mood: "intake", backdropSeed: "scanner", atmosphereLabel: "Scanner intake", tonalClass: "from-sky-500/20 via-cyan-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_12%_20%,rgba(56,189,248,.18),transparent_28%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(56,189,248,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,.05)_1px,transparent_1px)]" },
  asset_library: { mood: "archive", backdropSeed: "vault", atmosphereLabel: "Archive reference", tonalClass: "from-teal-500/20 via-cyan-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_24%_22%,rgba(45,212,191,.16),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,.12),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(45,212,191,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,.03)_1px,transparent_1px)]" },
  generation: { mood: "creative", backdropSeed: "forge", atmosphereLabel: "Creation forge", tonalClass: "from-fuchsia-500/20 via-violet-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_14%_18%,rgba(217,70,239,.2),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(167,139,250,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(217,70,239,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,.025)_1px,transparent_1px)]" },
  video_creation: { mood: "machine", backdropSeed: "queue", atmosphereLabel: "Production bay", tonalClass: "from-orange-500/20 via-violet-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_16%_20%,rgba(251,146,60,.2),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,.14),transparent_32%)]", gridClass: "bg-[linear-gradient(rgba(251,146,60,.028)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,.028)_1px,transparent_1px)]" },
  review: { mood: "checkpoint", backdropSeed: "threshold", atmosphereLabel: "Quality checkpoint", tonalClass: "from-amber-500/20 via-cyan-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,.18),transparent_30%),radial-gradient(circle_at_83%_12%,rgba(34,211,238,.12),transparent_28%)]", gridClass: "bg-[linear-gradient(rgba(245,158,11,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,.03)_1px,transparent_1px)]" },
  render: { mood: "machine", backdropSeed: "queue", atmosphereLabel: "Queue machinery", tonalClass: "from-blue-500/20 via-violet-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_12%_16%,rgba(59,130,246,.2),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(99,102,241,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(59,130,246,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.03)_1px,transparent_1px)]" },
  publish: { mood: "broadcast", backdropSeed: "control_room", atmosphereLabel: "Broadcast control room", tonalClass: "from-emerald-500/20 via-cyan-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,.2),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(6,182,212,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(16,185,129,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,.03)_1px,transparent_1px)]" },
  calendar: { mood: "signal", backdropSeed: "constellation", atmosphereLabel: "Timing orbit", tonalClass: "from-sky-500/20 via-blue-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_15%_18%,rgba(56,189,248,.18),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(96,165,250,.12),transparent_28%)]", gridClass: "bg-[linear-gradient(rgba(125,211,252,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.025)_1px,transparent_1px)]" },
  analytics: { mood: "signal", backdropSeed: "constellation", atmosphereLabel: "Signal field", tonalClass: "from-indigo-500/20 via-blue-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,.18),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(59,130,246,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(99,102,241,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,.03)_1px,transparent_1px)]" },
  automation: { mood: "machine", backdropSeed: "matrix", atmosphereLabel: "System lattice", tonalClass: "from-slate-500/20 via-zinc-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_18%_16%,rgba(148,163,184,.18),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(113,113,122,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(148,163,184,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.03)_1px,transparent_1px)]" },
  operations: { mood: "recovery", backdropSeed: "matrix", atmosphereLabel: "Recovery systems", tonalClass: "from-orange-700/20 via-zinc-500/10 to-slate-950", orbClass: "bg-[radial-gradient(circle_at_14%_20%,rgba(249,115,22,.2),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(161,161,170,.14),transparent_30%)]", gridClass: "bg-[linear-gradient(rgba(249,115,22,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,.025)_1px,transparent_1px)]" },
};

export function buildRuntimeWorldEntry(input: { card?: OperatorWorldCard | null; pathname?: string }): RuntimeWorldEntry {
  const card = input.card ?? null;
  const worldId = card ? resolveWorldFromEntityKind(card.kind) : resolveWorldFromPath(input.pathname ?? "/shopreel");
  const def = RUNTIME_WORLD_MAP[worldId];
  const snapshot = buildWorldSnapshot(card);
  const atmosphere = ATMOSPHERE_BY_WORLD[worldId];
  const title = card?.title ?? def.label;
  const status = card?.normalizedStatus ?? snapshot.progress.status;
  return {
    worldId,
    worldKind: def.shortLabel,
    entityKind: card?.kind ?? null,
    entityId: card?.id ?? null,
    href: card?.href ?? def.canonicalRoute,
    title,
    status,
    stageLabel: card?.stageLabel ?? def.goal,
    actionLabel: card?.actionLabel ?? def.primaryActions[0]?.label ?? "Open",
    objective: def.operatorCopy.objectiveTemplate,
    mood: atmosphere.mood,
    backdropSeed: atmosphere.backdropSeed,
    atmosphereLabel: atmosphere.atmosphereLabel,
    tonalClass: atmosphere.tonalClass,
    orbClass: atmosphere.orbClass,
    gridClass: atmosphere.gridClass,
    frameClass: "border border-white/15 bg-black/25 backdrop-blur-sm",
    panelClass: "border border-white/10 bg-black/30",
    transitionClass: "motion-safe:transition duration-300 ease-out motion-reduce:transition-none",
    visualSeed: `${worldId}:${title.toLowerCase()}:${status.toLowerCase()}:${snapshot.progress.status}`,
    primaryAction: def.primaryActions[0] ? { id: def.primaryActions[0].id, label: def.primaryActions[0].label, href: def.primaryActions[0].href ?? def.canonicalRoute } : null,
    secondaryActions: def.primaryActions.slice(1).map((action) => ({ id: action.id, label: action.label, href: action.href ?? def.canonicalRoute })),
    manualSurfaceHref: def.canonicalRoute,
    nextWorldRecommendation: def.nextWorldIds[0] ? { title: RUNTIME_WORLD_MAP[def.nextWorldIds[0]].label, summary: `Continue from ${def.shortLabel} into ${RUNTIME_WORLD_MAP[def.nextWorldIds[0]].shortLabel}.`, href: RUNTIME_WORLD_MAP[def.nextWorldIds[0]].canonicalRoute } : null,
    blockers: snapshot.blockers.map((item) => item.message),
    unresolvedCount: snapshot.blockers.length,
  };
}
