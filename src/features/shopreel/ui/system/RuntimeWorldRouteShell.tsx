"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import RuntimeWorldShell from "@/features/shopreel/ui/system/RuntimeWorldShell";
import { buildRuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";

const SHELL_PATHS = [
  "/shopreel/campaigns",
  "/shopreel/generations",
  "/shopreel/review",
  "/shopreel/render-queue",
  "/shopreel/publish-center",
  "/shopreel/upload",
  "/shopreel/library",
  "/shopreel/operations",
];

export default function RuntimeWorldRouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldWrap = SHELL_PATHS.some((path) => pathname.startsWith(path));
  if (!shouldWrap) return <>{children}</>;
  const entry = buildRuntimeWorldEntry({ pathname });
  return <RuntimeWorldShell entry={entry}>{children}</RuntimeWorldShell>;
}
