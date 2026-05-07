"use client";

import { useEffect, useState } from "react";

type Overview = { runs: Array<Record<string, unknown>>; features: Array<Record<string, unknown>>; campaigns: Array<Record<string, unknown>>; drafts: Array<Record<string, unknown>> };

export default function InternalGrowthAgentPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/internal-growth/overview");
    if (!res.ok) return setError("Failed to load overview");
    setData(await res.json());
  }

  async function runScan() {
    await fetch("/api/internal-growth/scan", { method: "POST" });
    await load();
  }

  useEffect(() => { void load(); }, []);

  if (error) return <div className="text-sm text-red-400">{error}</div>;
  if (!data) return <div className="text-sm text-zinc-400">Loading growth agent overview…</div>;

  return <div className="space-y-4"><button className="rounded bg-white/10 px-3 py-2 text-sm" onClick={() => void runScan()}>Run code scan</button><div className="grid gap-4 md:grid-cols-2"><section><h3 className="font-semibold">Features</h3><ul>{data.features.map((f) => <li key={String(f.id)} className="text-sm">{String(f.title)} · {String(f.status)}</li>)}</ul></section><section><h3 className="font-semibold">Drafts</h3><ul>{data.drafts.slice(0,20).map((d) => <li key={String(d.id)} className="text-sm">{String(d.platform)} · {String(d.format)} · {String(d.status)}</li>)}</ul></section></div><p className="text-xs text-zinc-400">Phase 1 creates drafts only. It cannot post.</p></div>;
}
