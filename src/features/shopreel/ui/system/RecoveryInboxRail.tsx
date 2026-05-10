"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { readWorkspaceMemory, writeWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { deriveTransitionSnapshot } from "@/features/shopreel/ui/system/transitionEngine";
import { readRecoveryInbox } from "@/features/shopreel/ui/system/recoveryInbox";

export default function RecoveryInboxRail() {
  const pathname = usePathname();
  const router = useRouter();
  const memory = useMemo(() => readWorkspaceMemory(), []);
  const items = useMemo(() => readRecoveryInbox(memory), [memory]);

  const resume = (route: string) => {
    const next = readWorkspaceMemory();
    if (!next) {
      router.push(route);
      return;
    }
    const transition = deriveTransitionSnapshot({
      currentRoute: pathname,
      targetRoute: route,
      command: "resume recovery workflow",
      interpretedIntent: next.lastWorkflow,
      memory: next,
    });
    writeWorkspaceMemory({
      ...next,
      transitionSnapshot: transition,
      lastRoute: route,
      updatedAt: new Date().toISOString(),
    });
    router.push(route);
  };

  if (!items.length) return null;
  return (
    <section className="rounded-2xl border border-amber-200/20 bg-amber-400/[0.06] p-3 text-xs text-amber-50">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-medium">Recovery inbox</div>
        <div className="text-amber-100/80">{items.length} active</div>
      </div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-amber-100/75">{item.workflow_type} · {item.current_stage}</div>
              <div>{item.recommended_next_action}</div>
            </div>
            <button onClick={() => resume(item.resume_route)} className="rounded-full border border-white/20 px-2 py-1 hover:bg-white/10">Resume workflow</button>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-amber-100/70">
        <Link href="/shopreel/generations" className="underline decoration-dotted underline-offset-2">Open generation queue</Link> ·{" "}
        <Link href="/shopreel/publish-queue" className="underline decoration-dotted underline-offset-2">Open publish queue</Link>
      </div>
    </section>
  );
}
