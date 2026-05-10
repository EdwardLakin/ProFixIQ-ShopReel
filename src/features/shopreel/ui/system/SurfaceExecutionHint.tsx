"use client";
import { type EcosystemSurface } from "@/features/shopreel/ui/system/ecosystemState";

const HINTS: Record<EcosystemSurface, string> = {
  home: "Continue your highest-priority draft.",
  create: "Continue work in editor.",
  campaigns: "Create or unblock a campaign.",
  render: "Resolve failed jobs, then clear queued jobs.",
  publish: "Package ready assets and publish.",
  library: "Find reusable assets for the next draft.",
  review: "Approve content and move to publish.",
  editor: "Finish timeline edits and save.",
};

export default function SurfaceExecutionHint({ surface }: { surface: EcosystemSurface }) {
  return <div className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-50"><span className="font-medium">Next action:</span> {HINTS[surface]}</div>;
}
