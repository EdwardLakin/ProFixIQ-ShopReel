"use client";
import { useMemo } from "react";
import { type EcosystemSurface } from "@/features/shopreel/ui/system/ecosystemState";
import { useGlobalEnvironmentContinuity } from "@/features/shopreel/ui/system/GlobalEnvironmentContinuityClient";

const SURFACE_HINT: Record<EcosystemSurface, string> = {
  home: "Workspaces", create: "Create", campaigns: "Campaigns", render: "Render queue", publish: "Ready to publish", library: "Library", review: "Needs review", editor: "Editor",
};

export default function EcosystemStateRail({ surface }: { surface: EcosystemSurface }) {
  const continuity = useGlobalEnvironmentContinuity();
  const title = SURFACE_HINT[surface];
  const detail = continuity.adaptiveAtmosphere?.activeFocusLabel ?? "steady progress";
  const diagnostics = useMemo(
    () => [
      `Fracture ${continuity.continuityFracture}`,
      `Render pressure ${continuity.renderInstability}`,
      `Export momentum ${continuity.exportMomentum}`,
      `Dormant influence ${continuity.dormantInfluence}`,
    ],
    [continuity],
  );

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/85">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p><span className="text-white/60">Active path</span> · <span className="font-semibold text-white">{title}</span></p>
        <p className="text-xs text-white/65">{detail}</p>
      </div>
      <details className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-white/65">
        <summary className="cursor-pointer text-white/80">System details</summary>
        <div className="mt-2 grid gap-1 md:grid-cols-2">{diagnostics.map((entry) => <div key={entry}>{entry}</div>)}</div>
      </details>
    </section>
  );
}
