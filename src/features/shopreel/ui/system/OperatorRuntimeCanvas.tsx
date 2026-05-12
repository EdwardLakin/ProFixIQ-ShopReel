"use client";

import Link from "next/link";
import { useMemo } from "react";
import { operatorSurfaceRegistry, resolveRuntimeFallbackRoute } from "@/features/shopreel/ui/system/operatorSurfaceRegistry";
import type { OperatorRuntimeSessionState } from "@/features/shopreel/ui/system/operatorRuntimeSession";

export default function OperatorRuntimeCanvas({
  session,
  onRecover,
  onInterruptManual,
}: {
  session: OperatorRuntimeSessionState;
  onRecover: () => void;
  onInterruptManual: () => void;
}) {
  const activeSurface = operatorSurfaceRegistry[session.activeSurface];
  const previousSurface = session.previousSurface ? operatorSurfaceRegistry[session.previousSurface] : null;
  const isThinking = session.pendingTransition !== null;
  const fallbackRoute = resolveRuntimeFallbackRoute(session.activeSurface, session.fallbackRoute);

  const transitionCopy = useMemo(() => {
    if (!session.pendingTransition) return "";
    return `Transition mode: ${session.pendingTransition.replaceAll("_", " ")}`;
  }, [session.pendingTransition]);

  return (
    <section className="relative rounded-[1.8rem] border border-cyan-200/25 bg-[#071023]/80 p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">Active workflow region</div>
          <h2 className="text-xl font-semibold text-white">{activeSurface.label}</h2>
        </div>
        <span className="rounded-full border border-cyan-100/25 px-2 py-1 text-xs text-cyan-100">{session.runtimeState}</span>
      </div>

      {isThinking ? <div className="mt-3 rounded-xl border border-violet-200/30 bg-violet-400/10 px-3 py-2 text-xs text-violet-100">Operator is interpreting and preparing the next surface. {transitionCopy}</div> : null}

      <div className="mt-4 grid gap-3">
        {previousSurface ? <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/55">Previous: {previousSurface.label}</div> : null}
        <div className="transition-all duration-300 motion-reduce:transition-none">{activeSurface.render()}</div>
      </div>

      {session.interruption ? (
        <div className="mt-4 rounded-xl border border-amber-200/30 bg-amber-500/10 p-3 text-sm text-amber-100">
          Interrupted: {session.interruption.reason}. You can recover previous workflow context anytime.
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={onInterruptManual} className="rounded-xl border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10">Open manual tools</button>
        <button onClick={onRecover} disabled={!session.recoverableContext} className="rounded-xl border border-cyan-200/35 px-3 py-2 text-sm text-cyan-100 disabled:opacity-50">Resume where we were</button>
        <Link href={fallbackRoute} className="rounded-xl border border-white/20 bg-white/[0.06] px-3 py-2 text-sm text-white/85">Open full workspace</Link>
      </div>
    </section>
  );
}
