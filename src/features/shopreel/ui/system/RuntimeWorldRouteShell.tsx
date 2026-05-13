"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import RuntimeWorldShell from "@/features/shopreel/ui/system/RuntimeWorldShell";
import { buildRuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

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
  const entry = buildRuntimeWorldEntry({
    pathname,
    card: snapshot && snapshot.href === pathname ? {
      id: snapshot.entityId ?? "route",
      kind: "campaign",
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

  return <RuntimeWorldShell entry={entry}>{children}</RuntimeWorldShell>;
}
