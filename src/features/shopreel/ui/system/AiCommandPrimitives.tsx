"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { classifyCommandIntent } from "@/features/shopreel/ui/system/commandIntentClassifier";

export type AiIntent = "latest" | "create" | "campaign" | "render" | "library" | "publish" | "ideas" | "editor" | "unknown";

export type CommandRouteResult = {
  intent: AiIntent;
  href?: string;
  summary: string;
  nextActions: Array<{ label: string; href: string }>;
};

export function interpretCommand(input: string): CommandRouteResult {
  const q = input.toLowerCase().trim();
  if (!q) return { intent: "unknown", summary: "Waiting for your command.", nextActions: [] };

  const classified = classifyCommandIntent(input);

  if (classified.classification === "ambiguous_needs_choice") {
    return {
      intent: "campaign",
      summary: "Continue current work or start new campaign from this brief?",
      nextActions: [
        { label: "Continue current work", href: "/shopreel/generations" },
        { label: "Start new campaign from this brief", href: "/shopreel/campaigns" },
      ],
    };
  }

  if (classified.classification === "create_new_campaign_brief") return { intent: "campaign", href: "/shopreel/campaigns", summary: "New campaign brief detected. Launch workspace ready.", nextActions: [{ label: "Create launch campaign", href: "/shopreel/campaigns" }, { label: "Draft launch messaging", href: "/shopreel/ideas" }, { label: "Generate content plan", href: "/shopreel/create" }, { label: "Create content workspace", href: "/shopreel/create" }] };
  if (classified.classification === "create_new_content_brief") return { intent: "create", href: "/shopreel/create", summary: "New content brief detected. Create workspace ready.", nextActions: [{ label: "Generate short-form ideas", href: "/shopreel/ideas" }, { label: "Build content plan", href: "/shopreel/create" }, { label: "Draft launch messaging", href: "/shopreel/ideas" }] };
  if (classified.classification === "continue_existing_work") return { intent: "latest", href: "/shopreel/generations", summary: "Existing render continuity detected.", nextActions: [{ label: "Open latest generation", href: "/shopreel/generations" }, { label: "Review continuity", href: "/shopreel/review" }] };
  if (classified.classification === "review_or_publish_existing_asset") return { intent: "publish", href: "/shopreel/exports", summary: "Ready to review or publish existing assets.", nextActions: [{ label: "Open exports", href: "/shopreel/exports" }, { label: "Open publish queue", href: "/shopreel/publish-queue" }] };

  if (/(render|failed render|processing|need attention)/.test(q)) return { intent: "render", href: "/shopreel/render-queue", summary: "I understood you want render status and exceptions.", nextActions: [{ label: "Open render queue", href: "/shopreel/render-queue" }, { label: "Open render jobs", href: "/shopreel/render-jobs" }] };
  if (/(library|assets|uploads)/.test(q)) return { intent: "library", href: "/shopreel/library", summary: "I understood you need asset/library access.", nextActions: [{ label: "Open library", href: "/shopreel/library" }, { label: "Open content", href: "/shopreel/content" }] };
  if (/(ideas|brainstorm)/.test(q)) return { intent: "ideas", href: "/shopreel/ideas", summary: "I understood you want ideation support.", nextActions: [{ label: "Open ideas", href: "/shopreel/ideas" }, { label: "Open opportunities", href: "/shopreel/opportunities" }] };
  if (/(editor|edit draft)/.test(q)) return { intent: "editor", href: "/shopreel/editor", summary: "I understood you want editor access.", nextActions: [{ label: "Open editor", href: "/shopreel/editor" }, { label: "Open generations", href: "/shopreel/generations" }] };

  return { intent: "unknown", summary: "I couldn't confidently map that yet, but I can route you to core workspaces.", nextActions: [{ label: "Open command home", href: "/shopreel" }, { label: "Open generations", href: "/shopreel/generations" }] };
}

export function AiCommandInput(props: { value: string; placeholder?: string; onChange?: (value: string) => void; readOnly?: boolean; className?: string }) {
  const handler = props.onChange
    ? (e: React.ChangeEvent<HTMLTextAreaElement>) => props.onChange?.(e.target.value)
    : undefined;
  return <textarea value={props.value} readOnly={props.readOnly} onChange={handler} placeholder={props.placeholder} className={`min-h-28 w-full rounded-3xl bg-black/45 px-5 py-4 text-base text-white shadow-[inset_0_0_0_1px_rgba(130,247,255,0.1),0_24px_60px_rgba(0,0,0,0.5)] outline-none placeholder:text-white/35 focus:shadow-[inset_0_0_0_1px_rgba(130,247,255,0.4),0_24px_60px_rgba(0,0,0,0.5)] ${props.className ?? ""}`.trim()} />;
}

export function AiIntentChip(props: { label: string; href: string; className?: string }) { return <Link href={props.href} className={`rounded-full bg-white/5 px-4 py-2 text-xs text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-cyan-400/15 ${props.className ?? ""}`.trim()}>{props.label}</Link>; }

export function AiWorkspaceStage(props: { title: string; children: ReactNode; className?: string }) { return <section className={`rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.45)] ${props.className ?? ""}`.trim()}><div className="mb-3 text-xs uppercase tracking-[0.16em] text-cyan-100/70">{props.title}</div>{props.children}</section>; }
export const AiPanel = AiWorkspaceStage;

export function AiNextQuestion({ intent }: { intent: AiIntent }) {
  const question = useMemo(() => {
    const questions: Record<AiIntent, string> = {
      latest: "Do you want the newest generation or everything from the last 24 hours?",
      create: "What assets or prompt should seed this draft?",
      campaign: "Which campaign or product are we analyzing?",
      render: "Do you want blocked, failed, processing, or ready renders?",
      library: "Are you looking for uploaded media, finished assets, or reusable campaign assets?",
      publish: "Should I package ready assets or inspect blocked items first?",
      ideas: "Do you want new hooks, angles, or full brief ideas?",
      editor: "Which draft should we open in the editor?",
      unknown: "What result do you want first: create, inspect, package, or review?",
    };
    return questions[intent];
  }, [intent]);
  return <div className="rounded-2xl bg-black/35 px-4 py-3 text-sm text-cyan-50/90">{question}</div>;
}

export function AiCommandCenter(props: { examples: string[] }) {
  const [value, setValue] = useState("");
  const interpreted = interpretCommand(value);
  return <div className="space-y-4"><AiCommandInput value={value} onChange={setValue} placeholder="Describe your intent. Example: Continue the campaign we were working on." />
    <div className="flex flex-wrap gap-2">{props.examples.map((x) => <button key={x} onClick={() => setValue(x)} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">{x}</button>)}</div>
    <AiNextQuestion intent={interpreted.intent} />
    {interpreted.href ? <Link href={interpreted.href} className="inline-flex rounded-xl bg-gradient-to-r from-violet-500/70 to-cyan-400/70 px-4 py-2 text-sm text-white">Open suggested workspace</Link> : null}
  </div>;
}
