"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { deriveEcosystemStateSnapshot } from "@/features/shopreel/ui/system/ecosystemState";
import { readWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { deriveGlobalEnvironmentContinuity, persistGlobalEnvironmentContinuity, type GlobalEnvironmentContinuitySnapshot } from "@/features/shopreel/ui/system/globalEnvironmentContinuity";

const fallbackSnapshot: GlobalEnvironmentContinuitySnapshot = {
  atmosphericContinuity: "calm continuity",
  escalationState: "calm",
  exportMomentum: 24,
  continuityFracture: 20,
  renderInstability: 18,
  dormantInfluence: 28,
  recoveryCorridor: "stable",
  routeTransitionMemory: "/shopreel → /shopreel",
  globalEnvironmentTone: "calm_continuity",
  explainability: ["No workspace memory yet, running safe deterministic defaults."],
};

const ContinuityContext = createContext<GlobalEnvironmentContinuitySnapshot>(fallbackSnapshot);

export function GlobalEnvironmentContinuityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState<GlobalEnvironmentContinuitySnapshot>(fallbackSnapshot);

  useEffect(() => {
    const memory = readWorkspaceMemory();
    const ecosystem = deriveEcosystemStateSnapshot(memory);
    const nextSnapshot = deriveGlobalEnvironmentContinuity({ memory, ecosystem, routeContext: pathname });
    setSnapshot(nextSnapshot);
    persistGlobalEnvironmentContinuity(nextSnapshot, pathname);
  }, [pathname]);

  const value = useMemo(() => snapshot, [snapshot]);
  return <ContinuityContext.Provider value={value}>{children}</ContinuityContext.Provider>;
}

export function useGlobalEnvironmentContinuity(): GlobalEnvironmentContinuitySnapshot {
  return useContext(ContinuityContext);
}

export function GlobalEnvironmentAmbientLine() {
  const continuity = useGlobalEnvironmentContinuity();
  return (
    <div className="pointer-events-none fixed left-3 right-3 top-14 z-30 md:left-[290px]">
      <div className="rounded-full border border-cyan-300/20 bg-slate-900/55 px-3 py-1 text-[11px] text-cyan-100/75 backdrop-blur">
        Production atmosphere: {continuity.exportMomentum >= 60 ? "export momentum rising" : continuity.atmosphericContinuity} · Continuity corridor {continuity.recoveryCorridor}
      </div>
    </div>
  );
}
