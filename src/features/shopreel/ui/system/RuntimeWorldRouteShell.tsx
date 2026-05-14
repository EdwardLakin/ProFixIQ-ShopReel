"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import RuntimeWorldShell from "@/features/shopreel/ui/system/RuntimeWorldShell";
import { buildRuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
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

  const nextActionLabel = entry.primaryAction?.label ?? "Review world details";
  return (
    <RuntimeWorldShell entry={entry}>
      <section className="mb-4 rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-white shadow-[0_16px_40px_rgba(0,0,0,.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">Entered world</p>
            <h1 className="mt-1 text-lg font-semibold">{entry.title}</h1>
            <p className="mt-1 text-sm text-white/75">Status: {entry.status} · Next: {nextActionLabel}</p>
          </div>
          {entry.primaryAction ? (
            <Link href={entry.primaryAction.href} className="rounded-lg border border-cyan-200/40 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-50">
              {entry.primaryAction.label}
            </Link>
          ) : null}
        </div>
      </section>
      {children}
    </RuntimeWorldShell>
  );
}
