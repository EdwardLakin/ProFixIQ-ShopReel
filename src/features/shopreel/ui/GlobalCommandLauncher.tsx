"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AiCommandInput, interpretCommand } from "@/features/shopreel/ui/system/AiCommandPrimitives";
import { readWorkspaceMemory, writeWorkspaceMemory } from "@/features/shopreel/ui/system/aiWorkspaceMemory";

const routeCommandSuggestions: Array<{ test: (path: string) => boolean; examples: string[] }> = [
  { test: (path) => path.startsWith("/shopreel/render"), examples: ["show failed renders", "package completed jobs", "open latest export"] },
  { test: (path) => path.startsWith("/shopreel/campaign"), examples: ["show PayProof performance", "continue this campaign", "generate variations"] },
  { test: (path) => path.startsWith("/shopreel/library"), examples: ["open latest upload", "start a draft from these assets", "find campaign-ready clips"] },
];

export default function GlobalCommandLauncher() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [focusLine, setFocusLine] = useState<string>("Focus: align next command with active production flow");
  const pathname = usePathname();
  const router = useRouter();
  const interpreted = interpretCommand(value);

  const contextualExamples = useMemo(() => {
    const routeMatch = routeCommandSuggestions.find((x) => x.test(pathname));
    return routeMatch?.examples ?? ["continue what we were working on", "open latest draft", "review render status"];
  }, [pathname]);

  useEffect(() => {
    const memory = readWorkspaceMemory();
    if (!memory) return;
    setHistory(memory.intentHistory);
    const pending = memory.pendingTasks.filter((task) => !task.done).length;
    const blockers = memory.pendingTasks.filter((task) => !task.done && /render|review|verify/i.test(task.label)).length;
    setFocusLine(blockers > 0 ? "Focus: recover render blockers" : pending === 0 ? "Focus: export-ready packaging" : "Focus: continue active workflow checkpoints");
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = () => {
    if (!interpreted.href) return;
    const nextHistory = [value, ...history].filter((x) => x.trim()).slice(0, 8);
    setHistory(nextHistory);
    const existing = readWorkspaceMemory();
    if (existing) {
      writeWorkspaceMemory({
        ...existing,
        lastCommand: value,
        lastRoute: interpreted.href,
        lastWorkflow: interpreted.intent,
        intentHistory: nextHistory,
        recentIntents: [interpreted.intent, ...existing.recentIntents].slice(0, 8),
        updatedAt: new Date().toISOString(),
      });
    }
    router.push(interpreted.href);
    setOpen(false);
  };

  const proactiveHint = history.length > 0 ? `Resume: ${history[0]}` : "No command memory yet. Start with a workflow instruction.";

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed right-3 top-3 z-40 rounded-full bg-cyan-400/15 px-3 py-2 text-xs text-cyan-50 backdrop-blur">
        AI Command ⌘K
      </button>
      {open ? <div className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_50%_18%,rgba(45,212,191,0.15),transparent_42%),rgba(2,4,11,0.82)] p-3 backdrop-blur-xl sm:p-6" onClick={() => setOpen(false)}>
        <div className="mx-auto mt-10 w-full max-w-3xl rounded-[2rem] bg-[#060b19]/92 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-all sm:p-6" onClick={(e) => e.stopPropagation()}>
          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-cyan-100/70">Global command mode · {pathname}</div>
          <AiCommandInput value={value} onChange={setValue} placeholder="Type a command..." className="min-h-24 text-lg" />
          <div className="mt-3 text-sm text-cyan-50/90">{interpreted.summary}</div>
          <div className="mt-2 text-xs text-cyan-100/70">{proactiveHint}</div>
          <div className="mt-1 text-xs text-cyan-200/80">{focusLine}</div>
          <div className="mt-3 flex flex-wrap gap-2">{contextualExamples.map((example) => <button key={example} onClick={() => setValue(example)} className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">{example}</button>)}</div>
          {history.length > 0 ? <div className="mt-4">
            <div className="mb-2 text-xs uppercase tracking-[0.16em] text-white/55">Recent commands</div>
            <div className="flex flex-wrap gap-2">{history.map((item) => <button key={item} onClick={() => setValue(item)} className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-50 hover:bg-cyan-400/20">{item}</button>)}</div>
          </div> : null}
          <button disabled={!interpreted.href} onClick={run} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-500/70 to-cyan-400/70 px-4 py-3 text-sm text-white disabled:opacity-40">
            Execute command
          </button>
        </div>
      </div> : null}
    </>
  );
}
