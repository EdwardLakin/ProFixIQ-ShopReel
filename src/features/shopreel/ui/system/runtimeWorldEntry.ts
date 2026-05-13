import type { OperatorWorldCard } from "@/features/shopreel/operator/operatorWorlds";
import { resolveWorldFromEntityKind, resolveWorldFromPath } from "@/features/shopreel/ui/system/pageToWorldAdapter";
import { RUNTIME_WORLD_MAP, type RuntimeWorldId } from "@/features/shopreel/ui/system/runtimeWorldMap";

export type RuntimeWorldVisualIdentity = {
  atmosphereLabel: string;
  backgroundTone: string;
  visualSeed: string;
};

export type RuntimeWorldAction = { id: string; label: string; href: string };
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

export type RuntimeWorldEntry = RuntimeWorldEnvironment & RuntimeWorldVisualIdentity & {
  href: string;
  primaryAction: RuntimeWorldAction | null;
  secondaryActions: RuntimeWorldAction[];
  manualSurfaceHref: string;
  nextWorldRecommendation: RuntimeWorldPanel | null;
  blockers: string[];
  unresolvedCount: number;
};

function pickTone(worldId: RuntimeWorldId): { atmosphereLabel: string; backgroundTone: string } {
  const table: Record<RuntimeWorldId, { atmosphereLabel: string; backgroundTone: string }> = {
    campaign: { atmosphereLabel: "Mission landscape", backgroundTone: "from-amber-500/20 via-violet-500/10 to-slate-950" },
    idea: { atmosphereLabel: "Discovery horizon", backgroundTone: "from-violet-500/20 via-cyan-500/10 to-slate-950" },
    upload: { atmosphereLabel: "Intake staging", backgroundTone: "from-blue-500/20 via-slate-500/10 to-slate-950" },
    asset_library: { atmosphereLabel: "Organized inventory", backgroundTone: "from-teal-500/20 via-cyan-500/10 to-slate-950" },
    generation: { atmosphereLabel: "Creative forge", backgroundTone: "from-fuchsia-500/20 via-violet-500/10 to-slate-950" },
    video_creation: { atmosphereLabel: "Production line", backgroundTone: "from-orange-500/20 via-violet-500/10 to-slate-950" },
    review: { atmosphereLabel: "Quality threshold", backgroundTone: "from-amber-500/20 via-cyan-500/10 to-slate-950" },
    render: { atmosphereLabel: "Processing stream", backgroundTone: "from-blue-500/20 via-violet-500/10 to-slate-950" },
    publish: { atmosphereLabel: "Release gate", backgroundTone: "from-emerald-500/20 via-cyan-500/10 to-slate-950" },
    calendar: { atmosphereLabel: "Timing orbit", backgroundTone: "from-sky-500/20 via-blue-500/10 to-slate-950" },
    analytics: { atmosphereLabel: "Signal field", backgroundTone: "from-indigo-500/20 via-blue-500/10 to-slate-950" },
    automation: { atmosphereLabel: "System lattice", backgroundTone: "from-slate-500/20 via-zinc-500/10 to-slate-950" },
    operations: { atmosphereLabel: "Control chamber", backgroundTone: "from-orange-700/20 via-zinc-500/10 to-slate-950" },
  };
  return table[worldId];
}

export function buildRuntimeWorldEntry(input: { card?: OperatorWorldCard | null; pathname?: string }): RuntimeWorldEntry {
  const card = input.card ?? null;
  const worldId = card ? resolveWorldFromEntityKind(card.kind) : resolveWorldFromPath(input.pathname ?? "/shopreel");
  const def = RUNTIME_WORLD_MAP[worldId];
  const tone = pickTone(worldId);
  const title = card?.title ?? def.label;
  const status = card?.normalizedStatus ?? "active";
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
    atmosphereLabel: tone.atmosphereLabel,
    backgroundTone: tone.backgroundTone,
    visualSeed: `${worldId}:${title.toLowerCase()}:${status.toLowerCase()}`,
    primaryAction: def.primaryActions[0] ? { id: def.primaryActions[0].id, label: def.primaryActions[0].label, href: def.primaryActions[0].href ?? def.canonicalRoute } : null,
    secondaryActions: def.primaryActions.slice(1).map((action) => ({ id: action.id, label: action.label, href: action.href ?? def.canonicalRoute })),
    manualSurfaceHref: def.canonicalRoute,
    nextWorldRecommendation: def.nextWorldIds[0] ? { title: RUNTIME_WORLD_MAP[def.nextWorldIds[0]].label, summary: `Continue from ${def.shortLabel} into ${RUNTIME_WORLD_MAP[def.nextWorldIds[0]].shortLabel}.`, href: RUNTIME_WORLD_MAP[def.nextWorldIds[0]].canonicalRoute } : null,
    blockers: card && /blocked|failed|review|approval|pending/.test(card.normalizedStatus) ? [card.normalizedStatus] : [],
    unresolvedCount: card && /blocked|failed|review|approval|pending/.test(card.normalizedStatus) ? 1 : 0,
  };
}
