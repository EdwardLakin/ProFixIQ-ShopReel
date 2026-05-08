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
  const [assistantText, setAssistantText] = useState("Tell me what to do, and I will route the workspace.");
  const [context, setContext] = useState<WorkingContext | null>(null);

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

    const countText = recent.length > 0 ? `I found ${recent.length} recent items.` : "I couldn't find recent persisted items yet.";
    setAssistantText(`${interpreted.summary} ${countText} Recommended next action: ${target}.`);
    persistContext(target);
    router.push(target);
  };

  const itemActions = (item: RecentItem) => {
    const base = `/shopreel/generations/${item.id}`;
    const renderDisabled = item.status.toLowerCase() === "draft";
    return [
      { label: "Open", href: base, disabled: false },
      { label: "Continue", href: base, disabled: false },
      { label: "Review", href: `/shopreel/review/${item.id}`, disabled: false },
      { label: "Package", href: "/shopreel/exports", disabled: !/(complete|ready|published)/i.test(item.status) },
      { label: "Render", href: "/shopreel/render-queue", disabled: renderDisabled },
    ];
  };

  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div className="space-y-4">
      <AiWorkspaceStage title="AI Command Center">
        <h1 className="text-3xl font-semibold md:text-4xl">What should ShopReel operate next?</h1>
        <p className="mt-2 text-sm text-white/65">AI command is primary. Manual navigation remains available as fallback.</p>
        <div className="mt-4 space-y-3">
          <AiCommandInput value={command} onChange={setCommand} placeholder="Try: continue what we were working on" />
          <div className="flex flex-wrap gap-2">{["show me my latest", "continue what we were working on", "show campaign data for PayProof", "create a reel from these uploads", "check renders that need attention", "package ready assets for publishing"].map((x) => <button key={x} onClick={() => setCommand(x)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">{x}</button>)}</div>
          <button onClick={runCommand} className="inline-flex rounded-xl bg-gradient-to-r from-violet-500/70 to-cyan-400/70 px-4 py-2 text-sm text-white">Execute command</button>
        </div>
      </AiWorkspaceStage>

      <AiWorkspaceStage title="AI Response & Next Step">
        <p className="text-sm text-cyan-50/90">{assistantText}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {interpreted.nextActions.map((action) => (
            <AiIntentChip key={action.href + action.label} label={action.label} href={action.href} />
          ))}
        </div>
      </AiWorkspaceStage>

      <AiWorkspaceStage title="Latest Activity">
        {recent.length === 0 ? <div className="text-sm text-white/60">No persisted activity yet. Start by creating a draft or uploading media into Library.</div> : <div className="space-y-2">{recent.map((r) => <div key={r.id} className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/85">
          <Link href={`/shopreel/generations/${r.id}`} className="block font-medium">{r.title}</Link>
          <div className="text-xs text-white/55">Status: {r.status}</div>
          <div className="mt-2 flex flex-wrap gap-2">{itemActions(r).map((action) => action.disabled ? <span key={action.label} title="Unavailable for current status" className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-white/35">{action.label}</span> : <Link key={action.label} href={action.href} className="rounded-full bg-cyan-400/10 px-2 py-1 text-[11px] text-cyan-50 hover:bg-cyan-400/20">{action.label}</Link>)}</div>
        </div>)}</div>}
      </AiWorkspaceStage>
    </div>
    <AiWorkspaceStage title="System Context">
      <div className="space-y-2 text-sm text-white/70">
        <div>AI routing: deterministic local interpreter</div>
        <div>Last intent: {context?.lastIntent ?? "none"}</div>
        <div>Last route: {context?.lastRoute ?? "none"}</div>
      </div>
    </AiWorkspaceStage>
  </div>;
}
