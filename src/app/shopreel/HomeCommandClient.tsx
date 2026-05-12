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

type StageTone = { label: string; tone: string; ring: string; cta: string; helper: string };

const stageLabel = (status: string): StageTone => {
  const normalized = status.toLowerCase();
  if (/(review|approval|needs)/.test(normalized)) return { label: "Needs approval", tone: "text-amber-100 bg-amber-400/20", ring: "ring-amber-300/40", cta: "Review now", helper: "Final review before publishing." };
  if (/(ready|completed|published)/.test(normalized)) return { label: "Draft ready", tone: "text-cyan-100 bg-cyan-400/20", ring: "ring-cyan-300/40", cta: "View draft", helper: "Ready for your feedback." };
  if (/(fail|error|blocked)/.test(normalized)) return { label: "Needs attention", tone: "text-rose-100 bg-rose-400/20", ring: "ring-rose-300/40", cta: "Open task", helper: "One item needs revision." };
  return { label: "Ready to plan", tone: "text-emerald-100 bg-emerald-400/20", ring: "ring-emerald-300/40", cta: "Continue campaign", helper: "Momentum is good—keep moving." };
};

const quickPrompts = [
  "Launch campaign",
  "Generate hooks",
  "Refine tone",
  "Review approvals",
  "Build publish package",
];

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
    const operationalGraph = buildOperationalGraph({ generationId: recent[0]?.id, campaignId: context?.lastCampaignId, pendingTaskCount: pendingTasks.filter((task) => !task.done).length, blockerCount: pendingTasks.filter((task) => /review|render|verify/i.test(task.label) && !task.done).length, readyTaskCount: recent.filter((item) => /ready|complete|published/i.test(item.status)).length, interrupted: false, continuityThreadCount: 0, lastRoute: route });

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
      <section className="relative overflow-hidden rounded-[2rem] border border-violet-200/20 bg-[linear-gradient(145deg,rgba(13,19,44,.9),rgba(6,9,24,.92))] p-5 shadow-[0_34px_110px_rgba(0,0,0,0.62)] md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(139,92,246,.22),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,.15),transparent_38%)]" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-end">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">SHOPREEL OPERATOR</div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-5xl">What do you want ShopReel to do next?</h1>
            <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-base">Plan campaigns, create content, refine drafts, get approvals, and learn your creative preferences. ShopReel handles the execution — you keep the vision.</p>
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/12 bg-black/20 px-3 py-2 text-xs text-white/70 backdrop-blur">
              <span>Ready to plan</span>
              <span className="text-white/35">•</span>
              <span>Taste memory active</span>
              <span className="text-white/35">•</span>
              <span>Approval gates enabled</span>
            </div>
            <div className="mt-6 rounded-3xl border border-violet-300/35 bg-[#090f25]/90 p-3 shadow-[inset_0_0_0_1px_rgba(34,211,238,.15)]">
              <AiCommandInput value={command} onChange={setCommand} placeholder="Describe what you want to create or accomplish…" className="min-h-32 border-transparent bg-transparent shadow-none focus-visible:ring-0" />
              <div className="mt-3 flex flex-wrap gap-2 px-2 pb-2">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => setCommand(prompt)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:border-violet-200/35 hover:bg-white/10">{prompt}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={runCommand} className="rounded-2xl bg-gradient-to-r from-violet-500/85 to-cyan-400/80 px-5 py-3 text-sm font-semibold text-white">Plan next move</button>
              <Link href="/shopreel/review" className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/80 hover:bg-white/10">Review approvals</Link>
              <Link href="/shopreel/campaigns" className="rounded-2xl px-4 py-3 text-sm text-white/55 transition hover:text-white/80">Open campaigns</Link>
            </div>
          </div>
          <aside className="relative rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(12,16,35,.9),rgba(8,12,24,.86))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_25px_55px_rgba(0,0,0,.45)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-300/70 via-cyan-300/60 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="mt-1 h-10 w-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(34,211,238,.85),rgba(139,92,246,.5),rgba(8,12,24,.95))] shadow-[0_0_26px_rgba(34,211,238,.35)] animate-pulse" />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/65">Operator intelligence</div>
                <div className="mt-1 text-lg font-semibold text-white">Operator ready</div>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/78">
              <li>Plan campaign from raw intent</li>
              <li>Route approvals to review inbox</li>
              <li>Apply recent taste memory</li>
              <li>Prepare next execution step</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Start with an idea", description: "Turn a concept into a full campaign plan.", href: "/shopreel/create" },
          { title: "Continue a campaign", description: "Pick up where you left off and keep momentum.", href: "/shopreel/campaigns" },
          { title: "Review approvals", description: "Approve, refine, or reject ShopReel proposals.", href: "/shopreel/review" },
          { title: "Add brand assets", description: "Upload and manage brand references.", href: "/shopreel/upload" },
        ].map((card) => (
          <Link key={card.title} href={card.href} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-violet-300/30 hover:bg-white/[0.07]">
            <div className="mb-3 h-10 w-10 rounded-xl border border-white/10 bg-gradient-to-br from-violet-400/25 to-cyan-400/25" />
            <div className="text-base font-semibold text-white">{card.title}</div>
            <p className="mt-1 text-sm text-white/65">{card.description}</p>
            <div className="mt-3 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70">→</div>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><div className="text-lg font-semibold text-white">Active work</div><Link href="/shopreel/campaigns" className="text-sm text-violet-200/80 hover:text-violet-100">View all campaigns →</Link></div>
        {recent.length === 0 ? <div className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/70">No active drafts yet. Start with a new idea or continue a campaign.</div> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recent.slice(0, 4).map((item, index) => {
              const stage = stageLabel(item.status);
              return <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#070d1f]">
                <div className={`h-24 bg-gradient-to-br ${index % 4 === 0 ? "from-cyan-300/45 via-violet-400/30 to-slate-900" : index % 4 === 1 ? "from-amber-300/35 via-violet-400/25 to-slate-900" : index % 4 === 2 ? "from-violet-400/45 via-cyan-300/20 to-slate-900" : "from-rose-300/35 via-cyan-300/15 to-slate-900"}`} />
                <div className="space-y-3 p-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${stage.tone} ring-1 ${stage.ring}`}>{stage.label}</span>
                  <div className="text-lg font-semibold text-white">{item.title}</div>
                  <p className="text-sm text-white/70">Next action: {stage.helper}</p>
                  <div className="flex gap-2"><Link href={`/shopreel/generations/${item.id}`} className="rounded-xl bg-violet-500/85 px-3 py-2 text-xs font-medium text-white">{stage.cta}</Link><Link href="/shopreel/review" className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/75">Review flow</Link></div>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(8,14,34,.95),rgba(8,11,24,.92))] p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Adaptive memory</div>
          <div className="mt-4 flex gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(56,189,248,.85),rgba(139,92,246,.45),rgba(15,23,42,.95))] shadow-[0_0_24px_rgba(56,189,248,.35)]" />
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex gap-2"><span className="text-emerald-300">✓</span><span>You usually prefer stronger emotional hooks for TikTok.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">✓</span><span>Recent refinements help ShopReel avoid corporate phrasing.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">✓</span><span>Approved pacing patterns will shape the next campaign plan.</span></li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="mb-3 text-sm font-semibold text-white">Advanced tools</div>
          <div className="grid gap-2 text-sm text-white/80">
            <Link href="/shopreel/render-jobs" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">Render jobs</Link>
            <Link href="/shopreel/publish-center" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">Publish center</Link>
            <Link href="/shopreel/operations" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">Operations</Link>
            <Link href="/shopreel/automation" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">Automation</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
