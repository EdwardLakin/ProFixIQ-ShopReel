"use client";

import { useMemo, useState, type MouseEvent } from "react";
import type { OperatorWorldCard } from "@/features/shopreel/operator/operatorWorlds";
import { resolveWorldFromEntityKind } from "@/features/shopreel/ui/system/pageToWorldAdapter";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import { RUNTIME_WORLD_COMPOSITIONS } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import { buildRuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import { buildRuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import { deriveRuntimeOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";

function clampIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
}

export default function RuntimeWorldDeck({
  items,
  unresolvedCount,
  runtimeSession,
  emphasizedCardId,
  prefersReducedMotion,
  onSelect,
}: {
  items: OperatorWorldCard[];
  unresolvedCount: number;
  runtimeSession: OperatorRuntimeSessionState;
  emphasizedCardId: string | null;
  prefersReducedMotion: boolean;
  onSelect: (
    item: OperatorWorldCard,
    event: MouseEvent<HTMLButtonElement>,
    index: number,
    deckGraph: ReturnType<typeof buildRuntimeEntityGraph>,
    temporalMemory: ReturnType<typeof buildRuntimeTemporalMemory>,
    choreography: ReturnType<typeof deriveWorldChoreography>,
  ) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = clampIndex(activeIndex, items.length);
  const maxVisible = 4;

  const visible = useMemo(() => {
    if (!items.length) return [];
    return items.slice(safeActiveIndex, safeActiveIndex + maxVisible);
  }, [items, safeActiveIndex]);

  const activeItem = visible[0] ?? null;
  const canGoBack = safeActiveIndex > 0;
  const canGoNext = safeActiveIndex < items.length - 1;

  const moveDeck = (dir: 1 | -1) => {
    setActiveIndex((current) => clampIndex(current + dir, items.length));
  };

  return (
    <div className="relative h-full min-h-[28rem] w-full overflow-hidden" role="region" aria-label="Operational world portal deck">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/52">Portal deck</p>
          <p className="mt-1 truncate text-sm text-white/72">
            {activeItem ? activeItem.title : "No active worlds yet"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={() => moveDeck(-1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.045] text-white/80 transition hover:border-cyan-200/35 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Show previous portal"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => moveDeck(1)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-white/[0.045] text-white/80 transition hover:border-cyan-200/35 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Show next portal"
          >
            ↓
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-8 top-[7.5rem] hidden h-56 rounded-full bg-cyan-400/10 blur-3xl lg:block" />

      <div className="relative h-[24rem] lg:h-[29rem] [perspective:1200px]">
        {visible.map((item, localIndex) => {
          const index = safeActiveIndex + localIndex;
          const active = localIndex === 0;
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
            worldSnapshot: {
              entityId: item.id,
              entityKind: item.kind,
              title: item.title,
              status: item.normalizedStatus,
              href: item.href,
            },
            continuity: {
              activeEntityId: item.id,
              breadcrumbs: runtimeSession.worldContinuity.breadcrumbs,
              activeRoute: runtimeSession.worldContinuity.activeRoute,
            },
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
            orchestration: deriveRuntimeOrchestration({
              worldId: worldKind,
              status: item.normalizedStatus,
              blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [],
              unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0,
              guidedStepId: null,
              previousWorldId: runtimeSession.previousWorldId,
              lastActionLabel: runtimeSession.worldContinuity.lastAction?.label ?? null,
              breadcrumbs: runtimeSession.worldContinuity.breadcrumbs,
              composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] },
              now: new Date().toISOString(),
              lastTransitionAt: item.updatedAt ?? null,
            }),
            entityGraph: deckGraph,
          });

          const selected = emphasizedCardId === `${item.kind}:${item.id}`;
          const y = localIndex * 28;
          const x = localIndex * 18;
          const scale = 1 - localIndex * 0.05;
          const rotate = localIndex * -2.5;
          const opacity = [1, 0.72, 0.44, 0.2][localIndex] ?? 0.12;

          return (
            <button
              id={`world-card-${item.id}`}
              key={`${item.kind}-${item.id}`}
              type="button"
              disabled={!active}
              onClick={(event) => onSelect(item, event, index, deckGraph, temporalMemory, choreography)}
              className={`absolute left-0 right-0 top-0 min-h-[20rem] lg:min-h-[24rem] overflow-hidden rounded-[1.65rem] border p-6 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
                active
                  ? "cursor-pointer border-amber-200/70 bg-[linear-gradient(180deg,rgba(40,24,36,.98),rgba(7,10,24,.99))]"
                  : selected
                    ? "border-cyan-200/65 bg-[linear-gradient(180deg,rgba(18,34,58,.96),rgba(7,10,24,.98))]"
                    : "cursor-default border-white/12 bg-[linear-gradient(180deg,rgba(17,20,43,.94),rgba(5,8,22,.99))]"
              }`}
              style={{
                zIndex: maxVisible - localIndex,
                opacity,
                transform: `translate3d(${x}px, ${y}px, ${-localIndex * 70}px) scale(${scale}) rotateX(${rotate}deg)`,
                transition: prefersReducedMotion
                  ? "none"
                  : "transform 280ms cubic-bezier(.2,.8,.2,1), opacity 220ms ease, box-shadow 260ms ease",
                boxShadow: active
                  ? "0 0 56px rgba(255,174,80,.24),0 30px 80px rgba(0,0,0,.62)"
                  : "0 18px 46px rgba(0,0,0,.46)",
              }}
              aria-selected={active}
              aria-label={active ? `Enter world ${item.title}` : `Stacked portal preview ${item.title}`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,196,111,.18),transparent_36%),radial-gradient(circle_at_90%_0%,rgba(103,232,249,.12),transparent_38%)]" />
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/50 to-transparent" />

              <div className="relative flex h-full min-h-[21rem] flex-col">
                <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.18em] text-amber-100/82">
                  <span>{active ? "Front portal" : "Queued portal"}</span>
                  <span className="text-white/48">
                    {safeActiveIndex + localIndex + 1}/{items.length}
                  </span>
                </div>

                <div className="mt-10">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/55">
                    {worldKind} · {item.sourceLabel}
                  </p>
                  <h2 className="mt-4 line-clamp-3 text-[clamp(1.55rem,2.2vw,2.25rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-white">
                    {item.title}
                  </h2>
                  <div className="mt-5 inline-flex rounded-full border border-violet-200/15 bg-violet-400/14 px-4 py-2 text-sm text-violet-100">
                    {item.stageLabel}
                  </div>
                </div>

                <div className="mt-auto flex items-end justify-between gap-5">
                  <div className="min-w-0 text-sm text-white/68">
                    <p className="truncate">{item.actionLabel}</p>
                    <p className="mt-1 text-xs text-white/42">
                      Chain {deckGraph.dependencies.length}/{deckGraph.traversal.blockers.length} · {temporalMemory.resilience}
                      {unresolvedCount ? ` · ${unresolvedCount} unresolved` : ""}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-amber-300/18 px-4 py-2 text-sm font-semibold text-amber-100 shadow-[0_0_24px_rgba(251,191,36,.14)]">
                    Enter world →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {items.length > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-white/46">
          <span>Most recent loads first. Use arrows to cycle the stack.</span>
          <span>{safeActiveIndex + 1} / {items.length}</span>
        </div>
      ) : null}
    </div>
  );
}
