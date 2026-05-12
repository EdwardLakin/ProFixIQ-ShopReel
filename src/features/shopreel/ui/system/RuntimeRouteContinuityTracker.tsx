"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { OperatorSurfaceId, OperatorRuntimeState } from "@/features/shopreel/ui/system/operatorRuntime";
import { readPersistedRuntimeSession, RUNTIME_SESSION_KEY } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

function mapPath(pathname: string): { surface: OperatorSurfaceId; state: OperatorRuntimeState; campaignId: string | null } | null {
  const match = pathname.match(/^\/shopreel\/campaigns\/([^/]+)/);
  if (match) return { surface: "campaign_workspace", state: "refining_output", campaignId: match[1] };
  if (pathname.startsWith("/shopreel/review")) return { surface: "review_inbox", state: "awaiting_approval", campaignId: null };
  if (pathname.startsWith("/shopreel/library")) return { surface: "asset_intake", state: "planning_campaign", campaignId: null };
  if (pathname.startsWith("/shopreel/operations")) return { surface: "manual_operations", state: "manual_operations_mode", campaignId: null };
  return null;
}

export default function RuntimeRouteContinuityTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const mapped = mapPath(pathname);
    if (!mapped) return;
    const previous = readPersistedRuntimeSession();
    const next = {
      activeCampaignId: mapped.campaignId ?? previous?.activeCampaignId ?? null,
      activeSurface: mapped.surface,
      previousSurface: previous?.activeSurface ?? null,
      progressionStage: mapped.state,
      interruptionReason: mapped.surface === "manual_operations" ? "Operational interruption" : null,
      returnTarget: "/shopreel",
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(RUNTIME_SESSION_KEY, JSON.stringify(next));
  }, [pathname]);

  return null;
}
