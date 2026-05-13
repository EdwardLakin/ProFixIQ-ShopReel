"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { clearWorldEntryTransition, persistWorldEntryTransition, readWorldEntryTransition, type RuntimeWorldEntrySnapshot, type RuntimeWorldEntryTransitionState } from "@/features/shopreel/ui/system/runtimeWorldEntryTransition";

type TransitionState = {
  activeTransition: RuntimeWorldEntryTransitionState | null;
  startWorldEntryTransition: (snapshot: RuntimeWorldEntrySnapshot, reducedMotion: boolean) => void;
  completeWorldEntryTransition: () => void;
};

const TransitionContextStore = createContext<TransitionState | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeTransition, setActiveTransition] = useState<RuntimeWorldEntryTransitionState | null>(null);

  useEffect(() => {
    setActiveTransition(readWorldEntryTransition());
  }, []);

  useEffect(() => {
    setActiveTransition((current) => {
      if (!current || current.phase !== "navigating") return current;
      if (pathname !== current.snapshot.href) return current;
      const next: RuntimeWorldEntryTransitionState = { ...current, phase: "arrived" };
      persistWorldEntryTransition(next);
      return next;
    });
  }, [pathname]);

  const startWorldEntryTransition = useCallback((snapshot: RuntimeWorldEntrySnapshot, reducedMotion: boolean) => {
    const transition: RuntimeWorldEntryTransitionState = {
      snapshot,
      reducedMotion,
      phase: reducedMotion ? "complete" : "navigating",
    };
    setActiveTransition(transition);
    if (reducedMotion) {
      clearWorldEntryTransition();
      return;
    }
    persistWorldEntryTransition(transition);
  }, []);

  const completeWorldEntryTransition = useCallback(() => {
    setActiveTransition(null);
    clearWorldEntryTransition();
  }, []);

  const value = useMemo(() => ({ activeTransition, startWorldEntryTransition, completeWorldEntryTransition }), [activeTransition, startWorldEntryTransition, completeWorldEntryTransition]);
  return <TransitionContextStore.Provider value={value}>{children}</TransitionContextStore.Provider>;
}

export function useTransitionRouter(): TransitionState {
  const value = useContext(TransitionContextStore);
  if (!value) throw new Error("useTransitionRouter must be used within TransitionProvider");
  return value;
}

export function TransitionLayer() {
  const { activeTransition } = useTransitionRouter();
  if (!activeTransition || activeTransition.phase === "complete" || activeTransition.reducedMotion) return null;

  const { rect } = activeTransition.snapshot;
  const entering = activeTransition.phase === "arrived";
  return <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
    <div className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ${entering ? "opacity-0" : "opacity-100"}`} />
    <div
      className={`absolute rounded-[2rem] border border-white/25 bg-[radial-gradient(circle_at_22%_18%,rgba(255,180,92,.22),transparent_42%),radial-gradient(circle_at_78%_16%,rgba(103,232,249,.24),transparent_44%),linear-gradient(180deg,rgba(13,17,31,.92),rgba(2,6,23,.98))] shadow-[0_40px_120px_rgba(0,0,0,.6)] transition-all duration-700 ease-[cubic-bezier(.22,.8,.24,1)]`}
      style={{
        left: entering ? 0 : rect.x,
        top: entering ? 0 : rect.y,
        width: entering ? "100vw" : rect.width,
        height: entering ? "100vh" : rect.height,
        borderRadius: entering ? 0 : 32,
      }}
    />
  </div>;
}

export function TransitionSurface({ children }: { children: ReactNode }) {
  return <div className="relative min-h-0 flex-1">{children}</div>;
}
