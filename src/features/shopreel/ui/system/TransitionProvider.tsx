"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deriveTransitionSnapshot, type TransitionContext, type TransitionSnapshot } from "@/features/shopreel/ui/system/transitionEngine";
import type { AiIntent } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import type { WorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

type TransitionState = {
  activeSnapshot: TransitionSnapshot | null;
  pushWithTransition: (targetRoute: string, command: string, interpretedIntent: AiIntent, memory: WorkspaceMemory | null) => void;
};

const TransitionContextStore = createContext<TransitionState | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeSnapshot, setActiveSnapshot] = useState<TransitionSnapshot | null>(null);

  const pushWithTransition = useCallback((targetRoute: string, command: string, interpretedIntent: AiIntent, memory: WorkspaceMemory | null) => {
    const context: TransitionContext = { currentRoute: pathname, targetRoute, command, interpretedIntent, memory };
    const snapshot = deriveTransitionSnapshot(context);
    setActiveSnapshot(snapshot);
    router.push(targetRoute);
  }, [pathname, router]);

  const value = useMemo(() => ({ activeSnapshot, pushWithTransition }), [activeSnapshot, pushWithTransition]);
  return <TransitionContextStore.Provider value={value}>{children}</TransitionContextStore.Provider>;
}

export function useTransitionRouter(): TransitionState {
  const value = useContext(TransitionContextStore);
  if (!value) throw new Error("useTransitionRouter must be used within TransitionProvider");
  return value;
}

export function TransitionLayer() {
  const transition = useTransitionRouter();
  if (!transition.activeSnapshot) return null;
  return <div className="pointer-events-none fixed inset-0 z-30 bg-gradient-to-b from-black/10 to-black/40 opacity-40 transition-opacity duration-300" />;
}

export function TransitionSurface({ children }: { children: ReactNode }) {
  return <div className="relative min-h-0 flex-1">{children}</div>;
}
