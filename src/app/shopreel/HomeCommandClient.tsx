"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AiCommandInput,
  AiIntentChip,
  AiWorkspaceStage,
  interpretCommand,
  type AiIntent,
} from "@/features/shopreel/ui/system/AiCommandPrimitives";

type RecentItem = { id: string; title: string; status: string };

type WorkingContext = {
  lastCommand: string;
  lastIntent: AiIntent;
  lastRoute: string;
  lastGenerationId?: string;
};

const STORAGE_KEY = "shopreel-working-context-v1";

export default function HomeCommandClient({ recent }: { recent: RecentItem[] }) {
  const router = useRouter();
  const [command, setCommand] = useState("");
  const [assistantText, setAssistantText] = useState("Continuing session standby. Give me the next instruction and I will orchestrate the workspace.");
  const [context, setContext] = useState<WorkingContext | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as WorkingContext;
    setContext(parsed);
    setCommand(parsed.lastCommand);
  }, []);

  const interpreted = useMemo(() => interpretCommand(command), [command]);

  const persistContext = (route: string) => {
    const next: WorkingContext = {
      lastCommand: command,
      lastIntent: interpreted.intent,
      lastRoute: route,
      lastGenerationId: recent[0]?.id,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setContext(next);
  };

  const runCommand = () => {
    const fallbackLatest = recent[0] ? `/shopreel/generations/${recent[0].id}` : "/shopreel/generations";
    const target =
      interpreted.intent === "latest" && /continue/.test(command.toLowerCase())
        ? context?.lastRoute ?? fallbackLatest
        : interpreted.href ?? "/shopreel";

    const countText = recent.length > 0 ? `I found ${recent.length} recent drafts. The newest reel was touched moments ago.` : "I couldn't find persisted activity yet, so I'll start from your command home.";
    setAssistantText(`${interpreted.summary} ${countText}`);
    setHistory((prev) => [command, ...prev].filter((x) => x.trim()).slice(0, 8));
    persistContext(target);
    router.push(target);
  };

  const activityStream = [
    `Continuing ${context?.lastIntent ?? "new"} session`,
    recent[0] ? `Latest draft located: ${recent[0].title}` : "No latest draft persisted yet",
    `${recent.filter((item) => /ready|complete|published/i.test(item.status)).length} outputs ready for packaging`,
    `Last active workspace: ${context?.lastRoute ?? "Command Home"}`,
    `Recent instruction interpreted as: ${interpreted.intent}`,
  ];

  return <div className="relative space-y-6 pb-6">
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-[0_40px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl md:p-7">
      <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-14 bottom-0 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Live command session</div>
        <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">What should the AI operating system run next?</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">This workspace is orchestration-first. Routes stay available, but workflow and context drive every move.</p>
        <div className={`mt-5 transition-all duration-300 ${isFocused ? "scale-[1.01]" : "scale-100"}`}>
          <AiCommandInput value={command} onChange={setCommand} placeholder="Try: show me my latest and package what is ready" className={`transition-all ${isFocused ? "min-h-40" : "min-h-28"}`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{["show me my latest", "continue what we were working on", "review + package", "show failed renders", "generate campaign variations"].map((x) => <button key={x} onClick={() => setCommand(x)} className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/75 hover:bg-white/10">{x}</button>)}</div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={runCommand} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} className="rounded-2xl bg-gradient-to-r from-violet-500/70 to-cyan-400/70 px-5 py-3 text-sm font-medium text-white">Run orchestration</button>
          <span className="text-xs text-white/60">AI command is primary · Manual navigation is fallback</span>
        </div>
      </div>
    </section>

    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <AiWorkspaceStage title="Assistant stream" className="border-0 bg-white/[0.02] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <p className="text-sm text-cyan-50/90">{assistantText}</p>
        <div className="mt-4 space-y-2">{activityStream.map((entry) => <div key={entry} className="rounded-2xl bg-black/25 px-3 py-2 text-sm text-white/80">{entry}</div>)}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {interpreted.nextActions.map((action) => (
            <AiIntentChip key={action.href + action.label} label={action.label} href={action.href} className="px-3 py-1.5 text-[11px]" />
          ))}
        </div>
      </AiWorkspaceStage>

      <AiWorkspaceStage title="Session memory" className="border-0 bg-white/[0.02] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        <div className="space-y-2 text-sm text-white/75">
          <div>AI routing: deterministic local interpreter</div>
          <div>Current intent: {interpreted.intent}</div>
          <div>Last intent: {context?.lastIntent ?? "none"}</div>
          <div>Last route: {context?.lastRoute ?? "none"}</div>
        </div>
        {history.length > 0 ? <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/55">Command history</div>
          <div className="flex flex-wrap gap-2">{history.map((item) => <button key={item} onClick={() => setCommand(item)} className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-50 hover:bg-cyan-400/20">{item}</button>)}</div>
        </div> : null}
      </AiWorkspaceStage>
    </section>

    <AiWorkspaceStage title="Operational workspaces" className="border-0 bg-white/[0.015]">
      {recent.length === 0 ? <div className="text-sm text-white/60">No persisted activity yet. Start by creating a draft or uploading media into Library.</div> : <div className="space-y-2">{recent.map((r) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-white/85">
        <div>
          <Link href={`/shopreel/generations/${r.id}`} className="block font-medium">{r.title}</Link>
          <div className="text-xs text-white/55">Status: {r.status}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/shopreel/generations/${r.id}`} className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-50">Continue work</Link>
          <Link href="/shopreel/render-queue" className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/75">Review outputs</Link>
          <Link href="/shopreel/exports" className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/75">Package & publish</Link>
        </div>
      </div>)}</div>}
    </AiWorkspaceStage>
  </div>;
}
