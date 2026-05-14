"use client";

import { useMemo, useState, type MouseEvent, type WheelEventHandler } from "react";
import type { OperatorWorldCard } from "@/features/shopreel/operator/operatorWorlds";
import { resolveWorldFromEntityKind } from "@/features/shopreel/ui/system/pageToWorldAdapter";
import { deriveWorldChoreography } from "@/features/shopreel/ui/system/runtimeWorldChoreography";
import { RUNTIME_WORLD_COMPOSITIONS } from "@/features/shopreel/ui/system/runtimeWorldComposition";
import { buildRuntimeEntityGraph } from "@/features/shopreel/ui/system/runtimeEntityGraph";
import { buildRuntimeTemporalMemory } from "@/features/shopreel/ui/system/runtimeTemporalMemory";
import { deriveRuntimeOrchestration } from "@/features/shopreel/ui/system/runtimeWorldOrchestration";
import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";

function statusTone(status: string) {
  if (/review|approval/i.test(status)) return "Awaiting review";
  if (/block|failed|error|interrupted/i.test(status)) return "Interrupted";
  if (/in_progress|running|draft|active/i.test(status)) return "Active";
  if (/completed|published/i.test(status)) return "Complete";
  return "Stable";
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
  const maxVisible = 5;
  const visible = useMemo(() => items.slice(activeIndex, activeIndex + maxVisible), [items, activeIndex]);

  const advance = (dir: 1 | -1) => {
    setActiveIndex((current) => Math.max(0, Math.min(Math.max(0, items.length - 1), current + dir)));
  };

  const handleWheel: WheelEventHandler<HTMLDivElement> = (event) => {
    if (Math.abs(event.deltaY) < 5) return;
    event.preventDefault();
    advance(event.deltaY > 0 ? 1 : -1);
  };

  return (
    <div
      className="relative h-full w-full"
      onWheel={handleWheel}
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          advance(-1);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          advance(1);
        }
      }}
      onTouchStart={(event) => {
        const y = event.touches[0]?.clientY ?? 0;
        event.currentTarget.dataset.touchStartY = String(y);
      }}
      onTouchEnd={(event) => {
        const startY = Number(event.currentTarget.dataset.touchStartY ?? "0");
        const endY = event.changedTouches[0]?.clientY ?? startY;
        const delta = startY - endY;
        if (Math.abs(delta) < 24) return;
        advance(delta > 0 ? 1 : -1);
      }}
      role="listbox"
      tabIndex={0}
      aria-label="Operational worlds deck"
      aria-activedescendant={visible[0] ? `world-card-${visible[0].id}` : undefined}
    >
      <div className="flex h-full flex-col gap-3 pb-4 pt-4 lg:pt-10">
      {visible.map((item, localIndex) => {
        const index = activeIndex + localIndex;
        const active = localIndex === 0;
        const worldKind = resolveWorldFromEntityKind(item.kind);
        const choreography = deriveWorldChoreography({ worldId: worldKind, status: item.normalizedStatus, blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [], unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0, guidedStepId: null, previousWorldId: runtimeSession.previousWorldId, lastActionLabel: runtimeSession.worldContinuity.lastAction?.label ?? null, breadcrumbs: runtimeSession.worldContinuity.breadcrumbs, composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] }, availableActions: [{ label: item.actionLabel }], transitionIntent: null });
        const deckGraph = buildRuntimeEntityGraph({ activeWorldId: worldKind, activeRoute: item.href, previousWorldId: runtimeSession.previousWorldId, worldTransitionHistory: runtimeSession.worldTransitionHistory, worldSnapshot: { entityId: item.id, entityKind: item.kind, title: item.title, status: item.normalizedStatus, href: item.href }, continuity: { activeEntityId: item.id, breadcrumbs: runtimeSession.worldContinuity.breadcrumbs, activeRoute: runtimeSession.worldContinuity.activeRoute }, composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] }, status: item.normalizedStatus, blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [], unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0 });
        const temporalMemory = buildRuntimeTemporalMemory({ now: new Date().toISOString(), activeWorldId: worldKind, status: item.normalizedStatus, unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0, blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [], breadcrumbs: runtimeSession.worldContinuity.breadcrumbs, transitionHistory: runtimeSession.worldTransitionHistory, choreography, orchestration: deriveRuntimeOrchestration({ worldId: worldKind, status: item.normalizedStatus, blockers: /failed|blocked|error/.test(item.normalizedStatus) ? [item.normalizedStatus] : [], unresolvedCount: /review|approval|pending/.test(item.normalizedStatus) ? 1 : 0, guidedStepId: null, previousWorldId: runtimeSession.previousWorldId, lastActionLabel: runtimeSession.worldContinuity.lastAction?.label ?? null, breadcrumbs: runtimeSession.worldContinuity.breadcrumbs, composition: RUNTIME_WORLD_COMPOSITIONS[worldKind] ?? { worldId: worldKind, panels: [] }, now: new Date().toISOString(), lastTransitionAt: item.updatedAt ?? null }), entityGraph: deckGraph });
        return (
          <button
            id={`world-card-${item.id}`}
            key={`${item.kind}-${item.id}`}
            type="button"
            onClick={(event) => {
              onSelect(item, event, index, deckGraph, temporalMemory, choreography);
            }}
            className={`group relative w-full overflow-hidden rounded-[1.25rem] border px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
              active
                ? "border-amber-200/70 bg-[linear-gradient(180deg,rgba(40,24,36,.96),rgba(7,10,24,.98))]"
                : emphasizedCardId === `${item.kind}:${item.id}`
                  ? "border-cyan-200/70 bg-[linear-gradient(180deg,rgba(18,34,58,.96),rgba(7,10,24,.98))]"
                  : "border-white/15 bg-[linear-gradient(180deg,rgba(17,20,43,.95),rgba(5,8,22,.98))]"
            }`}
            style={{
              zIndex: maxVisible - localIndex,
              opacity: active ? 1 : 0.96,
              transform: `translate3d(${active ? 0 : 16}px,0,0) scale(${active ? 1 : 0.98})`,
              transition: prefersReducedMotion ? "none" : "transform 220ms ease, opacity 220ms ease, box-shadow 220ms ease",
              boxShadow: active ? "0 0 45px rgba(255,174,80,.22),0 22px 64px rgba(0,0,0,.58)" : "0 16px 36px rgba(0,0,0,.46)",
            }}
            aria-selected={active}
          >
            <div className="relative">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-amber-100/82">
                <span>{active ? "Active" : statusTone(item.normalizedStatus)}</span>
                <span>{active ? "Current" : `${worldKind} · ${item.sourceLabel}`}</span>
              </div>
              <h2 className="mt-4 line-clamp-2 text-xl leading-tight tracking-[-0.02em] text-white">{item.title}</h2>
              <div className="mt-3 inline-flex rounded-full bg-violet-400/18 px-3 py-1.5 text-xs text-violet-100">{item.stageLabel}</div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/82">
              <span className="truncate">{active ? item.actionLabel : choreography.operatorCue.nextActionLabel ?? "Open"} · Chain {deckGraph.dependencies.length}/{deckGraph.traversal.blockers.length}</span>
              <span className={`shrink-0 rounded-full px-3 py-1 ${active ? "bg-amber-300/20 text-amber-100" : "bg-cyan-300/10 text-cyan-100/90"}`}>{active ? "Enter world →" : "Select portal"}</span>
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
}
