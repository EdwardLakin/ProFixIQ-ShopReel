import Link from "next/link";
import type { ReactNode } from "react";

export function AiCommandInput(props: { value?: string; placeholder?: string; readOnly?: boolean; onChange?: (value: string) => void }) {
  return <textarea value={props.value} readOnly={props.readOnly} onChange={(e) => props.onChange?.(e.target.value)} placeholder={props.placeholder} className="min-h-28 w-full rounded-3xl bg-black/45 px-5 py-4 text-base text-white shadow-[inset_0_0_0_1px_rgba(130,247,255,0.1),0_24px_60px_rgba(0,0,0,0.5)] outline-none placeholder:text-white/35 focus:shadow-[inset_0_0_0_1px_rgba(130,247,255,0.4),0_24px_60px_rgba(0,0,0,0.5)]" />;
}

export function AiIntentChip(props: { label: string; href: string }) { return <Link href={props.href} className="rounded-full bg-white/5 px-4 py-2 text-xs text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-cyan-400/15">{props.label}</Link>; }

export function AiPanel(props: { title: string; children: ReactNode }) { return <section className="rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.45)]"><div className="mb-3 text-xs uppercase tracking-[0.16em] text-cyan-100/70">{props.title}</div>{props.children}</section>; }
