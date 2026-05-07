"use client";

import { useEffect, useState } from "react";

type Overview = { runs: Array<Record<string, unknown>>; features: Array<Record<string, unknown>>; campaigns: Array<Record<string, unknown>>; drafts: Array<Record<string, unknown>>; summary?: Record<string, unknown> };

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

  const latestRun = data.runs[0];

  return <div className="space-y-4">
    <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">Internal developer system. Not customer-facing.</div>
    <div className="flex items-center gap-3">
      <button className="rounded bg-white/10 px-3 py-2 text-sm" onClick={() => void runScan()}>Run code scan</button>
      <span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-100">Draft-only mode</span>
    </div>
    <p className="text-xs text-zinc-300">No external posting occurs in Phase 1.</p>
    <section className="rounded border border-white/10 p-3 text-sm">
      <h3 className="font-semibold">Scan history</h3>
      <p className="text-xs text-zinc-400">Last scan: {latestRun ? String(latestRun.created_at) : "Never"}</p>
      <ul className="mt-2 space-y-1 text-xs text-zinc-300">{data.runs.slice(0, 8).map((run) => <li key={String(run.id)}>{String(run.created_at)} · {String(run.status)}{run.error_message ? ` · failure: ${String(run.error_message)}` : ""}</li>)}</ul>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>Discovered: {String(data.summary?.totalFeatures ?? 0)}</div>
        <div>Approved: {String(data.summary?.approvedFeatures ?? 0)}</div>
        <div>Ignored: {String(data.summary?.ignoredFeatures ?? 0)}</div>
        <div>Campaigns generated: {String(data.summary?.totalCampaigns ?? 0)}</div>
      </div>
    </section>
    <div className="grid gap-4 md:grid-cols-2"><section><h3 className="font-semibold">Features</h3><ul>{data.features.map((f) => <li key={String(f.id)} className="text-sm">{String(f.title)} · {String(f.status)}</li>)}</ul></section><section><h3 className="font-semibold">Drafts</h3><ul>{data.drafts.slice(0,20).map((d) => <li key={String(d.id)} className="text-sm">{String(d.platform)} · {String(d.format)} · {String(d.status)}</li>)}</ul></section></div>
  </div>;
}
