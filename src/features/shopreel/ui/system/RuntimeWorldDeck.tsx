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
  const maxVisible = 4;
  const visible = useMemo(() => items.slice(activeIndex, activeIndex + maxVisible), [items, activeIndex]);

  const advance = (dir: 1 | -1) => {
    setActiveIndex((current) => Math.max(0, Math.min(items.length - 1, current + dir)));
  };

  const handleWheel: WheelEventHandler<HTMLDivElement> = (event) => {
    if (Math.abs(event.deltaY) < 5) return;
    event.preventDefault();
    advance(event.deltaY > 0 ? 1 : -1);
  };

  return (
    <div
      className="relative h-full"
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
              if (!active) return setActiveIndex(index);
              onSelect(item, event, index, deckGraph, temporalMemory, choreography);
            }}
            className={`group absolute right-0 top-0 min-h-[23rem] w-[min(32rem,100%)] overflow-hidden rounded-[1.6rem] border p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
              active
                ? "border-amber-200/65 bg-[linear-gradient(180deg,rgba(38,22,36,.96),rgba(8,10,26,.98))]"
                : emphasizedCardId === `${item.kind}:${item.id}`
                  ? "border-cyan-200/70 bg-[linear-gradient(180deg,rgba(22,36,58,.96),rgba(8,10,26,.98))]"
                  : "border-white/12 bg-[linear-gradient(180deg,rgba(17,20,43,.9),rgba(5,8,22,.98))]"
            }`}
            style={{
              zIndex: maxVisible - localIndex,
              opacity: 1 - localIndex * 0.16,
              transform: `translate3d(${localIndex * 10}px, ${localIndex * -14}px, 0) scale(${1 - localIndex * 0.04})`,
              transition: prefersReducedMotion ? "none" : "transform 260ms ease, opacity 260ms ease, box-shadow 260ms ease",
              boxShadow: active ? "0 0 65px rgba(255,174,80,.24),0 34px 90px rgba(0,0,0,.62)" : "0 20px 46px rgba(0,0,0,.52)",
            }}
            aria-selected={active}
          >
            <div className="relative">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-amber-100/82">
                <span>{active ? "Active" : statusTone(item.normalizedStatus)}</span>
                <span>{active ? "Current" : `${worldKind} · ${item.sourceLabel}`}</span>
              </div>
              <h2 className="mt-8 line-clamp-3 text-2xl leading-tight tracking-[-0.03em] text-white">{item.title}</h2>
              <div className="mt-7 inline-flex rounded-full bg-violet-400/18 px-4 py-2 text-sm text-violet-100">{item.stageLabel}</div>
            </div>
            <div className="absolute bottom-8 left-6 right-6 text-xs text-white/72">
              {active ? item.actionLabel : choreography.operatorCue.nextActionLabel ?? "Open"} · Chain {deckGraph.dependencies.length}/{deckGraph.traversal.blockers.length} · Stability {temporalMemory.resilience}
            </div>
          </button>
        );
      })}
    </div>
  );
}
