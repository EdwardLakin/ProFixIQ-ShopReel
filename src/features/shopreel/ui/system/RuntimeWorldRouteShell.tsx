"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { buildRuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { buildOperatorFlowState } from "@/features/shopreel/operator-flow/operatorFlow";
import OperatorWorkflowHeader from "@/features/shopreel/ui/system/OperatorWorkflowHeader";
import { readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";
import type { OperatorWorldKind } from "@/features/shopreel/operator/operatorWorlds";

const WORLD_ROUTE_PATTERNS = [
  "/shopreel/campaigns",
  "/shopreel/generations",
  "/shopreel/review",
  "/shopreel/render-queue",
  "/shopreel/render-jobs",
  "/shopreel/publish-center",
  "/shopreel/publish-queue",
  "/shopreel/upload",
  "/shopreel/library",
  "/shopreel/opportunities",
  "/shopreel/video-creation",
  "/shopreel/calendar",
  "/shopreel/analytics",
  "/shopreel/operations",
  "/shopreel/operator",
];

export default function RuntimeWorldRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldWrap = WORLD_ROUTE_PATTERNS.some((path) => pathname.startsWith(path));
  if (!shouldWrap) return <>{children}</>;

  const persisted = readPersistedRuntimeSession();
  const snapshot = persisted?.worldEntrySnapshot;
  const cardKind: OperatorWorldKind = snapshot?.entityKind === "campaign" || snapshot?.entityKind === "generation" || snapshot?.entityKind === "manual_asset" || snapshot?.entityKind === "publication" || snapshot?.entityKind === "render_job" || snapshot?.entityKind === "opportunity" ? snapshot.entityKind : "campaign";
  const entry = buildRuntimeWorldEntry({
    pathname,
    card: snapshot && snapshot.href === pathname ? {
      id: snapshot.entityId ?? "route",
      kind: cardKind,
      title: snapshot.title,
      status: snapshot.status,
      normalizedStatus: snapshot.status,
      stageLabel: "Runtime workspace",
      actionLabel: "Open manual workspace",
      href: snapshot.href,
      sourceLabel: "runtime",
      priority: "normal",
      updatedAt: new Date().toISOString(),
      createdAt: null,
    } : undefined,
  });

  const flow = buildOperatorFlowState({
    command: `continue ${pathname}`,
    entity: { kind: entry.entityKind, status: entry.status, href: pathname, title: entry.title, id: entry.entityId },
  });

  return (
    <>
      <OperatorWorkflowHeader flow={flow} title={entry.title} />
      {children}
    </>
  );

}