"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { OperatorFlowState } from "@/features/shopreel/operator-flow/operatorFlow";

export default function OperatorWorkflowHeader({ flow, title }: { flow: OperatorFlowState; title: string }) {
  const pathname = usePathname();

  const approvalNextHref =
    flow.stage === "campaign_plan" || flow.stage === "script" || flow.stage === "scenes" || flow.stage === "creative_output"
      ? pathname.startsWith("/shopreel/campaigns")
        ? pathname
        : "/shopreel/campaigns"
      : flow.nextRouteAfterApproval;

  const approvalLabel =
    flow.stage === "campaign_plan"
      ? "Continue in campaign"
      : flow.stage === "scenes" || flow.stage === "creative_output"
        ? "Continue production"
        : "Approve → Next";

  return (
    <section className="mb-4 rounded-2xl border border-white/15 bg-slate-950/70 px-4 py-3 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/80">Operator workflow</p>
          <h1 className="mt-1 text-lg font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-white/75">Stage: {flow.stage.replaceAll("_", " ")} · {flow.reason}</p>
          <p className="text-xs text-white/60">Recommended next action: {flow.recommendedNextAction.replaceAll("_", " ")}</p>
        </div>
        <div className="flex gap-2">
          <Link href={approvalNextHref} className="rounded-lg border border-cyan-200/40 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-50">{approvalLabel}</Link>
          <Link href={flow.revisionRoute} className="rounded-lg border border-white/25 px-3 py-2 text-sm text-white/85">Revise</Link>
        </div>
      </div>
    </section>
  );
}
