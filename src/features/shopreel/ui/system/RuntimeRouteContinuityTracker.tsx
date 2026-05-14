"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { OperatorSurfaceId, OperatorRuntimeState } from "@/features/shopreel/ui/system/operatorRuntime";
import { resolveRuntimeSurfaceFromRoute } from "@/features/shopreel/ui/system/runtimeOrchestration";
import { persistRuntimeEnvironment } from "@/features/shopreel/ui/system/runtimeEnvironmentalPersistence";
import { readPersistedRuntimeSession, RUNTIME_SESSION_KEY } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

function mapPath(pathname: string): { surface: OperatorSurfaceId; state: OperatorRuntimeState; campaignId: string | null } | null {
  const runtimeSurface = resolveRuntimeSurfaceFromRoute(pathname);
  const match = pathname.match(/^\/shopreel\/campaigns\/([^/]+)/);
  if (match) return { surface: "campaign_workspace", state: "refining_output", campaignId: match[1] };
  if (pathname.startsWith("/shopreel/review")) return { surface: "review_inbox", state: "awaiting_approval", campaignId: null };
  if (pathname.startsWith("/shopreel/library")) return { surface: "asset_intake", state: "planning_campaign", campaignId: null };
  if (pathname.startsWith("/shopreel/operations")) return { surface: "manual_operations", state: "manual_operations_mode", campaignId: null };
  return null;
}

function deriveMissionTrajectory(pathname: string): "forward" | "deeper" | "recess" | "wider" {
  if (pathname.startsWith("/shopreel/review") || pathname.startsWith("/shopreel/render-queue")) return "deeper";
  if (pathname.startsWith("/shopreel/operations")) return "recess";
  if (pathname.startsWith("/shopreel/library") || pathname.startsWith("/shopreel/publish")) return "wider";
  return "forward";
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
      worldPersistence: {
        chamberIdentity: mapped.surface === "campaign_workspace" ? "campaign_chamber" : mapped.surface === "review_inbox" ? "review_chamber" : mapped.surface === "manual_operations" ? "operations_chamber" : "runtime_chamber",
        continuityMemory: [
          mapped.surface,
          mapped.state,
          previous?.worldContinuity?.lastViewedSection ?? "",
          previous?.worldContinuity?.lastAction?.label ?? "",
        ].filter(Boolean).slice(0, 6),
        lastFocalSurface: previous?.worldContinuity?.focusedPanelId ?? previous?.worldPersistence?.lastFocalSurface ?? null,
        unresolvedApprovals: previous?.worldPersistence?.unresolvedApprovals ?? 0,
        activeRenderState: pathname.startsWith("/shopreel/render-queue") ? "rendering" : previous?.worldPersistence?.activeRenderState ?? null,
        activeExecutionLane: mapped.surface,
        missionTrajectory: deriveMissionTrajectory(pathname),
        pressureWeight: mapped.surface === "manual_operations" ? 0.82 : mapped.surface === "review_inbox" ? 0.66 : 0.46,
      },
    };
    window.localStorage.setItem(RUNTIME_SESSION_KEY, JSON.stringify(next));
    persistRuntimeEnvironment({
      topologyPressure: mapped.surface === "manual_operations" ? 0.8 : 0.45,
      chamberRhythm: mapped.state === "interpreting_intent" ? 0.55 : 0.7,
      focalContinuity: mapped.campaignId ? 0.85 : 0.5,
      operationalFatigue: mapped.surface === "manual_operations" ? 0.65 : 0.35,
      narrativeMomentum: mapped.surface === "campaign_workspace" ? 0.75 : 0.5,
    });
  }, [pathname]);

  return null;
}
