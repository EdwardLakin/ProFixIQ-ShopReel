"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ShopReelNotificationsBell from "@/features/shopreel/ui/ShopReelNotificationsBell";
import { AiCommandInput, interpretCommand } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import { readWorkspaceMemory, type WorkspaceMemory, writeWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { buildOperationalGraph, planCommandExecution } from "@/features/shopreel/ui/system/operationalGraph";
import { buildPendingTasks, buildContinuityThreads } from "@/features/shopreel/ui/system/aiWorkspaceMemory";
import { executeShopReelCommand } from "@/features/shopreel/ui/system/executeShopReelCommand";
import { resolveOperatorRuntime } from "@/features/shopreel/ui/system/resolveOperatorRuntime";
import type { OperatorRuntimeResolution, OperatorSurfaceId } from "@/features/shopreel/ui/system/operatorRuntime";

type RecentItem = { id: string; title: string; status: string };

type StageTone = { label: string; tone: string; ring: string; cta: string; helper: string };

const stageLabel = (status: string): StageTone => {
  const normalized = status.toLowerCase();
  if (/(review|approval|needs)/.test(normalized)) return { label: "Needs approval", tone: "text-amber-100 bg-amber-400/20", ring: "ring-amber-300/40", cta: "Review now", helper: "Final review before publishing." };
  if (/(ready|completed|published)/.test(normalized)) return { label: "Draft ready", tone: "text-cyan-100 bg-cyan-400/20", ring: "ring-cyan-300/40", cta: "View draft", helper: "Ready for your feedback." };
  if (/(fail|error|blocked)/.test(normalized)) return { label: "Needs attention", tone: "text-rose-100 bg-rose-400/20", ring: "ring-rose-300/40", cta: "Open task", helper: "One item needs revision." };
  return { label: "Ready to plan", tone: "text-emerald-100 bg-emerald-400/20", ring: "ring-emerald-300/40", cta: "Continue campaign", helper: "Momentum is good—keep moving." };
};

const runtimeSurfaceCopy: Record<OperatorSurfaceId, string> = {
  idle_command: "Operator console is standing by.",
  campaign_planning: "Campaign planning is ready to materialize here.",
  review_inbox: "Review inbox can render here next.",
  asset_intake: "Asset intake can render here next.",
  publish_package_review: "Publish package review can render here next.",
  manual_operations: "Manual operations can open from here.",
  campaign_workspace: "Campaign workspace can render here next.",
  blocked_recovery: "Operator needs more input before this workflow can continue.",
  export_ready: "Export-ready handoff can render here next.",
};

const runtimeSurfaceTitle: Record<OperatorSurfaceId, string> = {
  idle_command: "Idle command surface",
  campaign_planning: "Campaign planning",
  review_inbox: "Review inbox",
  asset_intake: "Asset intake",
  publish_package_review: "Publish package review",
  manual_operations: "Manual operations",
  campaign_workspace: "Campaign workspace",
  blocked_recovery: "Blocked recovery",
  export_ready: "Export ready",
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
  const [runtimeResolution, setRuntimeResolution] = useState<OperatorRuntimeResolution>(() => resolveOperatorRuntime({ rawCommand: "", currentPath: "/shopreel" }));

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
    const runtime = resolveOperatorRuntime({
      rawCommand: command,
      classifiedIntent: execution.commandIntent,
      currentPath: context?.lastRoute ?? "/shopreel",
      selectedCampaignId: context?.lastCampaignId ?? null,
      hasPendingApprovals: recent.some((item) => /review|approval|needs/i.test(item.status)),
      hasActiveCampaign: recent.length > 0,
      hasAssetsContext: Boolean(context?.creativeContinuity),
    });
    setRuntimeResolution(runtime);
    persistContext(execution.selectedRoute);
    router.push(execution.selectedRoute);
  };

  return (
    <div className="space-y-7 pb-10">
      <section className={`relative overflow-hidden rounded-[2.2rem] border bg-[linear-gradient(145deg,rgba(10,16,38,.92),rgba(4,7,19,.97))] shadow-[0_40px_130px_rgba(0,0,0,0.66)] transition-all duration-300 ${runtimeResolution.state === "idle" ? "border-violet-200/28 p-6 md:p-8 lg:p-9" : "border-cyan-200/45 p-5 md:p-6 lg:p-7"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(139,92,246,.3),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(34,211,238,.2),transparent_42%),radial-gradient(circle_at_50%_120%,rgba(14,165,233,.12),transparent_38%)]" />
        <div className="relative z-10 grid gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] xl:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-100/75"><span>SHOPREEL OPERATOR</span><span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-cyan-100/80">Operator ready</span></div>
            <h1 className="mt-3 max-w-[14ch] text-3xl font-semibold leading-[1.05] text-white md:text-5xl">What do you want ShopReel to do next?</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75 md:text-base">Plan campaigns, create content, refine drafts, get approvals, and learn your creative preferences. ShopReel handles the execution — you keep the vision.</p>
            <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-white/12 bg-black/20 px-3 py-2 text-xs text-white/70 backdrop-blur">
              <span>Ready to plan</span>
              <span className="text-white/35">•</span>
              <span>Taste memory active</span>
              <span className="text-white/35">•</span>
              <span>Approval gates enabled</span>
            </div>
            <div className="mt-5 group/console rounded-[1.7rem] border border-violet-300/45 bg-[#090f25]/94 p-3.5 shadow-[inset_0_0_0_1px_rgba(34,211,238,.2),inset_0_-20px_44px_rgba(3,7,18,.75),0_22px_46px_rgba(0,0,0,.4)] transition-all duration-300 hover:border-cyan-300/40 focus-within:border-cyan-300/60 focus-within:shadow-[inset_0_0_0_1px_rgba(34,211,238,.34),0_0_0_1px_rgba(56,189,248,.35),0_28px_64px_rgba(0,0,0,.48),0_0_48px_rgba(56,189,248,.16)]">
              <AiCommandInput value={command} onChange={setCommand} placeholder="Describe what you want to create or accomplish…" className="min-h-36 border-transparent bg-transparent shadow-none focus-visible:ring-0 transition-all duration-300" />
              <div className="mt-3 flex flex-wrap gap-2 px-2 pb-2">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => setCommand(prompt)} className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs text-white/82 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200/45 hover:bg-white/12">{prompt}</button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button onClick={runCommand} className="rounded-2xl bg-gradient-to-r from-violet-500/90 to-cyan-400/85 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(76,29,149,.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(45,212,191,.28)]">Plan next move</button>
              <Link href="/shopreel/review" className="rounded-2xl border border-white/18 bg-white/[0.06] px-5 py-3 text-sm text-white/82 transition-all duration-300 hover:border-cyan-200/30 hover:bg-white/12">Review approvals</Link>
              <Link href="/shopreel/campaigns" className="rounded-2xl px-4 py-3 text-sm text-white/55 transition hover:text-white/80">Open campaigns</Link>
              <div className="ml-auto"><ShopReelNotificationsBell /></div>
            </div>
          </div>
          <aside className="relative rounded-3xl border border-white/14 bg-[linear-gradient(180deg,rgba(12,16,35,.95),rgba(8,12,24,.9))] p-5 lg:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_25px_55px_rgba(0,0,0,.45)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-300/70 via-cyan-300/60 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="mt-1 h-10 w-10 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(34,211,238,.85),rgba(139,92,246,.5),rgba(8,12,24,.95))] shadow-[0_0_26px_rgba(34,211,238,.35)] animate-pulse" />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/65">Operator intelligence</div>
                <div className="mt-1 text-lg font-semibold text-white">Operator ready</div>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>Plan campaign from raw intent</li>
              <li>Route approvals to review inbox</li>
              <li>Apply recent taste memory</li>
              <li>Prepare next execution step</li>
            </ul>
            <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/55">Intent in. Campaign-ready steps out.</p>
          </aside>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-200/20 bg-cyan-950/25 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/65">Active runtime surface (scaffold)</div>
            <h2 className="mt-1 text-base font-semibold text-white">{runtimeSurfaceTitle[runtimeResolution.surfaceId]}</h2>
          </div>
          <span className="rounded-full border border-cyan-200/30 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">{runtimeResolution.state}</span>
        </div>
        <p className="mt-2 text-sm text-white/75">{runtimeResolution.summary}</p>
        <p className="mt-2 text-sm text-white/65">{runtimeSurfaceCopy[runtimeResolution.surfaceId]}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/65">
          <span>Inline runtime is being prepared.</span>
          <span className="text-white/30">•</span>
          <span>Fallback route remains fully supported.</span>
        </div>
        <div className="mt-4">
          <Link href={runtimeResolution.recommendedRouteFallback} className="inline-flex rounded-xl border border-white/20 bg-white/[0.06] px-3.5 py-2 text-sm text-white/85 transition hover:bg-white/[0.12]">Open full workspace</Link>
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

      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,14,31,.72),rgba(5,9,24,.64))] p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-[0.18em] text-cyan-100/65">Active work</div><div className="mt-1 text-lg font-semibold text-white">Campaigns in motion</div></div><Link href="/shopreel/campaigns" className="text-sm text-violet-200/80 hover:text-violet-100">View all campaigns →</Link></div>
        {recent.length === 0 ? <div className="rounded-2xl bg-white/[0.04] p-4 text-sm text-white/70">No active drafts yet. Start with a new idea or continue a campaign.</div> : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {recent.slice(0, 1).map((item) => {
              const stage = stageLabel(item.status);
              return <article key={item.id} className="group relative overflow-hidden rounded-[1.7rem] border border-white/12 bg-[#070d1f] p-5 shadow-[0_20px_60px_rgba(0,0,0,.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/28"><div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(34,211,238,.2),transparent_38%),radial-gradient(circle_at_84%_0%,rgba(139,92,246,.2),transparent_36%)]"/><div className="relative z-10"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${stage.tone} ring-1 ${stage.ring}`}>{stage.label}</span><h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3><p className="mt-2 max-w-xl text-sm text-white/72">{stage.helper} ShopReel is holding context and prepared to advance as soon as you approve the next move.</p><div className="mt-5 flex gap-2"><Link href={`/shopreel/generations/${item.id}`} className="rounded-xl bg-violet-500/90 px-3.5 py-2 text-xs font-medium text-white">{stage.cta}</Link><Link href="/shopreel/review" className="rounded-xl border border-white/15 px-3.5 py-2 text-xs text-white/75">Review flow</Link></div></div></article>;
            })}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {recent.slice(1, 4).map((item, index) => {
                const stage = stageLabel(item.status);
                return <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#070d1f]/92 p-4 transition-all duration-300 hover:border-violet-300/30"><div className={`mb-3 h-1.5 rounded-full bg-gradient-to-r ${index % 2 === 0 ? "from-cyan-300/70 to-violet-400/70" : "from-amber-300/65 to-violet-400/65"}`} /><div className="text-sm font-semibold text-white">{item.title}</div><p className="mt-1 text-xs text-white/68">{stage.label} · {stage.helper}</p></article>;
              })}
            </div>
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
              <li className="flex gap-2"><span className="text-emerald-300">✓</span><span>ShopReel is mirroring your preferred plainspoken and emotional tone.</span></li>
              <li className="flex gap-2"><span className="text-emerald-300">✓</span><span>Recent approvals are reinforcing your preferred pacing and scene rhythm.</span></li>
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
