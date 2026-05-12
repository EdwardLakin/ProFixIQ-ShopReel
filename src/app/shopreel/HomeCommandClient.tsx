"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AiCommandInput, interpretCommand } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import { readWorkspaceMemory, type WorkspaceMemory, writeWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { buildOperationalGraph, planCommandExecution } from "@/features/shopreel/ui/system/operationalGraph";
import { buildPendingTasks, buildContinuityThreads } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { executeShopReelCommand } from "@/features/shopreel/ui/system/executeShopReelCommand";

type RecentItem = { id: string; title: string; status: string };

const stageLabel = (status: string) => {
  const normalized = status.toLowerCase();
  if (/(review|approval|needs)/.test(normalized)) return "Needs approval";
  if (/(ready|completed|published)/.test(normalized)) return "Draft ready";
  if (/(render|processing|queued)/.test(normalized)) return "In production";
  if (/(fail|error|blocked)/.test(normalized)) return "Needs attention";
  return "Ready to plan";
};

export default function HomeCommandClient({ recent }: { recent: RecentItem[] }) {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [context, setContext] = useState<WorkspaceMemory | null>(null);
  const interpreted = useMemo(() => interpretCommand(command), [command]);

  useEffect(() => {
    const parsed = readWorkspaceMemory();
    if (!parsed) return;
    setContext(parsed);
    setCommand(parsed.lastCommand);
  }, []);

  const persistContext = (route: string) => {
    const pendingTasks = buildPendingTasks(interpreted.intent);
    const operationalGraph = buildOperationalGraph({
      generationId: recent[0]?.id,
      campaignId: context?.lastCampaignId,
      pendingTaskCount: pendingTasks.filter((task) => !task.done).length,
      blockerCount: pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length,
      readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length,
      interrupted: false,
      continuityThreadCount: 0,
      lastRoute: route,
    });

    const base = context ?? readWorkspaceMemory();
    if (!base) return;
    const next: WorkspaceMemory = {
      ...base,
      lastWorkflow: interpreted.intent,
      lastCommand: command,
      lastRoute: route,
      pendingTasks,
      continuityThreads: buildContinuityThreads({ intent: interpreted.intent, pendingTasks, lastRoute: route }),
      operationalGraph,
      lastExecutionPlan: planCommandExecution(command, operationalGraph, route, interpreted.intent),
      updatedAt: new Date().toISOString(),
    };
    writeWorkspaceMemory(next);
    setContext(next);
  };

  const runCommand = () => {
    const execution = executeShopReelCommand({ command, lastRoute: context?.lastRoute, source: "home_command" });
    persistContext(execution.selectedRoute);
    router.push(execution.selectedRoute);
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.55)] md:p-8">
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">ShopReel Operator</div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-5xl">Tell ShopReel what you want to create.</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-base">Describe the outcome. ShopReel will shape the campaign, ask for approval, execute the next step, and learn your creative taste over time.</p>
        <div className="mt-6">
          <AiCommandInput
            value={command}
            onChange={setCommand}
            placeholder="Launch a campaign for…&#10;Turn this idea into 5 short-form posts…&#10;Refine my active campaign to feel less corporate…&#10;Review what needs my approval…"
            className="min-h-36"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={runCommand} className="rounded-2xl bg-gradient-to-r from-violet-500/80 to-cyan-400/80 px-5 py-3 text-sm font-semibold text-white">Plan next move</button>
          <Link href="/shopreel/review" className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/80 hover:bg-white/10">Review approvals</Link>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Start with an idea", description: "Move from concept to campaign plan in one guided flow.", href: "/shopreel/create" },
          { title: "Continue a campaign", description: "Return to active campaign work and keep momentum.", href: "/shopreel/campaigns" },
          { title: "Review approvals", description: "Approve or refine ShopReel’s next decisions.", href: "/shopreel/review" },
          { title: "Add brand assets", description: "Upload source material ShopReel can learn from.", href: "/shopreel/upload" },
        ].map((card) => (
          <Link key={card.title} href={card.href} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.07]">
            <div className="text-sm font-semibold text-white">{card.title}</div>
            <p className="mt-2 text-xs text-white/65">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
        <div className="mb-4 text-lg font-semibold text-white">Active work</div>
        {recent.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/70">No active drafts yet. Start with a new idea or continue a campaign.</div>
        ) : (
          <div className="space-y-3">
            {recent.slice(0, 5).map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-base font-semibold text-white">{item.title}</div>
                <div className="mt-1 text-xs text-cyan-100/80">{stageLabel(item.status)}</div>
                <div className="mt-2 text-sm text-white/70">Next recommended action: {stageLabel(item.status) === "Needs approval" ? "Review next decision" : "Continue campaign"}.</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/shopreel/generations/${item.id}`} className="rounded-full bg-cyan-400/25 px-4 py-2 text-xs font-semibold text-cyan-50">Continue campaign</Link>
                  <Link href="/shopreel/review" className="rounded-full border border-white/15 px-3 py-2 text-xs text-white/75">Review next decision</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/75">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Adaptive memory</div>
        <p className="mt-2">ShopReel is learning your preferred tone, pacing, and hook style. Recent feedback will shape future campaign plans and reduce generic AI phrasing.</p>
      </section>

      <details className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
        <summary className="cursor-pointer text-white">Advanced tools</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/shopreel/render-jobs" className="rounded-full bg-white/5 px-3 py-1.5">Render jobs</Link>
          <Link href="/shopreel/publish-center" className="rounded-full bg-white/5 px-3 py-1.5">Publish center</Link>
          <Link href="/shopreel/operations" className="rounded-full bg-white/5 px-3 py-1.5">Operations</Link>
          <Link href="/shopreel/automation" className="rounded-full bg-white/5 px-3 py-1.5">Automation</Link>
        </div>
      </details>
    </div>
  );
}
