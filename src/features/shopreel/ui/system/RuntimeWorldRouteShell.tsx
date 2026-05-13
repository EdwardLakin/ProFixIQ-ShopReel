"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import RuntimeWorldShell from "@/features/shopreel/ui/system/RuntimeWorldShell";
import { buildRuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";

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
  "/shopreel/ideas",
  "/shopreel/video-creation",
  "/shopreel/analytics",
  "/shopreel/operations",
];

export default function RuntimeWorldRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldWrap = WORLD_ROUTE_PATTERNS.some((path) => pathname.startsWith(path));
  if (!shouldWrap) return <>{children}</>;
  const entry = buildRuntimeWorldEntry({ pathname });
  return <RuntimeWorldShell entry={entry}>{children}</RuntimeWorldShell>;
}
