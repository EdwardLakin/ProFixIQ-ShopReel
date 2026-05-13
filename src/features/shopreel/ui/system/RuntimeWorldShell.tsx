"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { resolveGuidedFlowStep, resolveWorldGuidedPrompt } from "@/features/shopreel/ui/system/guidedWorldFlow";
import type { RuntimeWorldAction, RuntimeWorldEntry } from "@/features/shopreel/ui/system/runtimeWorldEntry";
import { RUNTIME_WORLD_MAP } from "@/features/shopreel/ui/system/runtimeWorldMap";
import { createWorldEntryTransition, deriveWorldTransitionClasses } from "@/features/shopreel/ui/system/runtimeWorldTransition";
import { persistWorldEntrySnapshot, readPersistedRuntimeSession } from "@/features/shopreel/ui/system/runtimeSessionPersistence";

function actionForWorld(worldId: RuntimeWorldEntry["worldId"]): RuntimeWorldAction[] {
  return RUNTIME_WORLD_MAP[worldId].primaryActions.map((item) => ({ id: item.id, label: item.label, href: item.href ?? RUNTIME_WORLD_MAP[worldId].canonicalRoute }));
}

export default function RuntimeWorldShell({ entry, children }: { entry: RuntimeWorldEntry; children: ReactNode }) {
  const router = useRouter();
  const persisted = readPersistedRuntimeSession();
  const prompt = resolveWorldGuidedPrompt(entry.worldId);
  const guidedStepId = persisted?.worldContinuity.guidedStepId;
  const flow = guidedStepId ? resolveGuidedFlowStep(guidedStepId) : null;
  const manualActions = actionForWorld(entry.worldId);
  const transition = createWorldEntryTransition({ mode: "resume_world", fromWorldId: persisted?.previousWorldId ?? null, toWorldId: entry.worldId, fromRoute: persisted?.worldContinuity.previousRoute ?? null, toRoute: persisted?.worldContinuity.activeRoute ?? entry.href, label: "resume", at: new Date().toISOString() }, false);
  const transitionClass = deriveWorldTransitionClasses(transition);

  const navigate = (href: string, step: string | null, label: string) => {
    persistWorldEntrySnapshot({ worldId: entry.worldId, href, entityId: entry.entityId, entityKind: entry.entityKind, title: entry.title, status: entry.status, visualSeed: entry.visualSeed, guidedStep: step as never });
    router.push(href);
  };

  return <div className={`relative min-h-screen text-white ${entry.transitionClass} ${transitionClass.container}`}>
    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${entry.tonalClass}`} />
    <div className={`pointer-events-none absolute inset-0 ${entry.orbClass}`} />
    <div className={`pointer-events-none absolute inset-0 ${entry.gridClass} bg-[size:72px_72px] opacity-35`} />
    <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-4 md:px-6">
      <section className={`rounded-2xl p-4 ${entry.frameClass}`}>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{entry.worldKind} world</p>
        <h1 className="text-2xl font-semibold">{entry.title}</h1>
        <p className="text-sm text-white/70">{entry.stageLabel} · {entry.status} · {entry.objective}</p>
      </section>
      <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={`min-h-0 rounded-2xl p-3 ${entry.panelClass}`}>{children}</div>
        <aside className={`rounded-2xl p-4 text-sm ${entry.panelClass}`}>
          <p>{flow?.question ?? prompt.question}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button onClick={() => navigate(prompt.yes.href, prompt.yes.nextStep, prompt.yes.label)} className="rounded-lg border border-emerald-200/40 bg-emerald-400/10 px-3 py-2 text-xs">Yes</button>
            <button onClick={() => navigate(prompt.no.href, prompt.no.nextStep, prompt.no.label)} className="rounded-lg border border-amber-200/40 bg-amber-400/10 px-3 py-2 text-xs">No</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{manualActions.map((action) => <Link key={action.id} href={action.href} className="rounded-full border border-white/20 px-3 py-1 text-xs">{action.label}</Link>)}</div>
          <div className="mt-4 flex gap-2"><Link href={persisted?.worldContinuity.environment.returnToDeckHref ?? "/shopreel"} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back to deck</Link><Link href={entry.manualSurfaceHref} className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-3 py-2 text-sm">Open full manual route</Link></div>
        </aside>
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/75">
        Previous world: {persisted?.previousWorldId ?? "none"} · Active route: {persisted?.worldContinuity.activeRoute ?? entry.href} · Last action: {persisted?.worldContinuity.lastAction?.label ?? "none"}
      </section>
    </div>
  </div>;
}
