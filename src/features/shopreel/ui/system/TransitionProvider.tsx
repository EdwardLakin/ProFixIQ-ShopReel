"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { clearRuntimeSpatialTransition, deriveFocusTransfer, persistRuntimeSpatialTransition, readRuntimeSpatialTransition, type RuntimeCameraState, type RuntimeSpatialSnapshot, type RuntimeSpatialTransitionState } from "@/features/shopreel/ui/system/runtimeSpatialTransition";
import { deriveRuntimeWorldCamera } from "@/features/shopreel/ui/system/runtimeWorldSpatialModel";

type TransitionState = {
  activeTransition: RuntimeSpatialTransitionState | null;
  startWorldEntryTransition: (snapshot: RuntimeSpatialSnapshot, reducedMotion: boolean) => void;
  advanceWorldEntryCamera: (camera: RuntimeCameraState) => void;
  completeWorldEntryTransition: () => void;
};

const TransitionContextStore = createContext<TransitionState | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeTransition, setActiveTransition] = useState<RuntimeSpatialTransitionState | null>(null);

  useEffect(() => {
    setActiveTransition(readRuntimeSpatialTransition());
  }, []);

  useEffect(() => {
    setActiveTransition((current) => {
      if (!current) return current;
      if (current.reducedMotion || current.phase === "complete") {
        clearRuntimeSpatialTransition();
        return null;
      }
      if (current.phase === "navigating" && pathname !== current.snapshot.href) {
        clearRuntimeSpatialTransition();
        return null;
      }
      if (current.phase !== "navigating") return current;
      const next: RuntimeSpatialTransitionState = { ...current, phase: "arrived", camera: "entering", focus: deriveFocusTransfer("entering", current.reducedMotion) };
      persistRuntimeSpatialTransition(next);
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    if (!activeTransition || activeTransition.reducedMotion || activeTransition.phase !== "arrived") return;
    const timeoutId = window.setTimeout(() => {
      setActiveTransition((current) => {
        if (!current || current.phase !== "arrived") return current;
        clearRuntimeSpatialTransition();
        return null;
      });
    }, 520);
    return () => window.clearTimeout(timeoutId);
  }, [activeTransition]);

  const startWorldEntryTransition = useCallback((snapshot: RuntimeSpatialSnapshot, reducedMotion: boolean) => {
    const transition: RuntimeSpatialTransitionState = {
      snapshot,
      reducedMotion,
      camera: reducedMotion ? "immersed" : "docked",
      focus: deriveFocusTransfer(reducedMotion ? "immersed" : "docked", reducedMotion),
      phase: reducedMotion ? "complete" : "navigating",
    };
    setActiveTransition(transition);
    if (reducedMotion) {
      clearRuntimeSpatialTransition();
      return;
    }
    persistRuntimeSpatialTransition(transition);
  }, []);

  const advanceWorldEntryCamera = useCallback((camera: RuntimeCameraState) => {
    setActiveTransition((current) => {
      if (!current) return current;
      const next: RuntimeSpatialTransitionState = { ...current, camera, focus: deriveFocusTransfer(camera, current.reducedMotion) };
      persistRuntimeSpatialTransition(next);
      return next;
    });
  }, []);

  const completeWorldEntryTransition = useCallback(() => {
    setActiveTransition(null);
    clearRuntimeSpatialTransition();
  }, []);

  const value = useMemo(() => ({ activeTransition, startWorldEntryTransition, advanceWorldEntryCamera, completeWorldEntryTransition }), [activeTransition, startWorldEntryTransition, advanceWorldEntryCamera, completeWorldEntryTransition]);
  return <TransitionContextStore.Provider value={value}>{children}</TransitionContextStore.Provider>;
}

export function useTransitionRouter(): TransitionState {
  const value = useContext(TransitionContextStore);
  if (!value) throw new Error("useTransitionRouter must be used within TransitionProvider");
  return value;
}

export function TransitionLayer() {
  const { activeTransition } = useTransitionRouter();
  if (!activeTransition || activeTransition.phase !== "navigating" && activeTransition.phase !== "arrived" || activeTransition.reducedMotion) return null;

  const { cardRect, atmosphere } = activeTransition.snapshot;
  const entering = activeTransition.phase === "arrived";
  const shouldTransform = !activeTransition.reducedMotion;
  const camera = deriveRuntimeWorldCamera(activeTransition.camera, activeTransition.reducedMotion);
  return <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
    <div className="absolute inset-0 transition-opacity duration-300" style={{ opacity: entering ? 0.2 : 0.45, background: "linear-gradient(180deg,rgba(1,4,14,.65),rgba(1,4,14,.38) 40%,rgba(1,4,14,.14))" }} />
    <div className="absolute inset-0 transition-opacity duration-300" style={{ opacity: entering ? 0.08 : 0.22, background: "radial-gradient(circle at 50% 50%,rgba(255,196,128,.24),transparent 42%)" }} />
    <div
      className={`absolute rounded-[2rem] border border-white/30 shadow-[0_30px_80px_rgba(0,0,0,.55)] transition-all duration-500 ease-[cubic-bezier(.22,.8,.24,1)]`}
      style={{
        left: shouldTransform ? (entering ? 0 : cardRect.x) : 0,
        top: shouldTransform ? (entering ? 0 : cardRect.y) : 0,
        width: shouldTransform ? (entering ? "100vw" : cardRect.width) : "100vw",
        height: shouldTransform ? (entering ? "100vh" : cardRect.height) : "100vh",
        borderRadius: shouldTransform ? (entering ? 0 : 32) : 0,
        opacity: entering ? 0.88 : activeTransition.focus.shellOpacity,
        transform: `translate3d(${entering ? 0 : cardRect.x * 0.02}px,${camera.translateY}px,${entering ? 0 : 24}px) scale(${camera.scale})`,
        filter: `blur(${Math.min(1.2, camera.blur)}px)`,
        background: `radial-gradient(circle at 22% 18%,rgba(255,180,92,${0.14 + atmosphere.graphStressIntensity * 0.08}),transparent 38%),linear-gradient(180deg,rgba(13,17,31,.92),rgba(2,6,23,.98))`,
      }}
    />
  </div>;
}

export function TransitionSurface({ children }: { children: ReactNode }) {
  return <div className="relative min-h-0 flex-1">{children}</div>;
}
