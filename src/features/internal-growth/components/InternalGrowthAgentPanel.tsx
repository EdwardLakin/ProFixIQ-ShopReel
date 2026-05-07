"use client";
import { useEffect, useState } from "react";

type Overview = { runs: Array<Record<string, unknown>>; features: Array<Record<string, unknown>>; campaigns: Array<Record<string, unknown>>; drafts: Array<Record<string, unknown>>; signals: Array<Record<string, unknown>>; sources: Array<Record<string, unknown>>; summary?: Record<string, unknown> };

export default function InternalGrowthAgentPanel() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignPackage, setCampaignPackage] = useState<Record<string, unknown> | null>(null);

  async function load() { const res = await fetch("/api/internal-growth/overview"); if (!res.ok) return setError("Failed to load overview"); setData(await res.json()); }
  async function runScan() { await fetch("/api/internal-growth/scan", { method: "POST" }); await load(); }
  async function loadPackage(campaignId: string) { setSelectedCampaignId(campaignId); const res = await fetch(`/api/internal-growth/campaigns/${campaignId}/package`); if (res.ok) setCampaignPackage(await res.json()); }

  useEffect(() => { void load(); }, []);
  if (error) return <div className="text-sm text-red-400">{error}</div>;
  if (!data) return <div className="text-sm text-zinc-400">Loading growth agent overview…</div>;

  return <div className="space-y-4">
    <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">Internal developer system. Not customer-facing.</div>
    <div className="rounded border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-100"><p className="font-semibold">Dogfood roadmap</p><ul className="list-disc pl-4"><li>Phase 1: Detect and draft</li><li>Phase 2: Plan assets</li><li>Phase 3: Render packages</li><li>Phase 4: Schedule/publish with approval</li><li>Phase 5: Optimize from analytics</li></ul><p className="mt-2">This internal system is the proving ground for a future public Growth Engine.</p></div>
    <div className="flex items-center gap-3"><button className="rounded bg-white/10 px-3 py-2 text-sm" onClick={() => void runScan()}>Run code scan</button><span className="rounded bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-100">Draft-only mode</span></div>
    <p className="text-xs text-zinc-300">No external posting occurs in this bridge phase.</p>
    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded border border-white/10 p-3 text-sm"><h3 className="font-semibold">Signals</h3><ul className="space-y-1 text-xs">{data.signals.slice(0,12).map((s)=><li key={String(s.id)}>{String(s.title)} · {String(s.signal_type)} · {String(s.status)}</li>)}</ul></div>
      <div className="rounded border border-white/10 p-3 text-sm"><h3 className="font-semibold">Sources</h3><ul className="space-y-1 text-xs">{data.sources.map((s)=><li key={String(s.id)}>{String(s.display_name)} · {String(s.source_type)} · {String(s.status)}</li>)}</ul></div>
    </section>
    <section className="rounded border border-white/10 p-3 text-sm"><h3 className="font-semibold">Campaign package preview</h3><div className="mt-2 flex flex-wrap gap-2">{data.campaigns.slice(0,10).map((c)=><button key={String(c.id)} className={`rounded px-2 py-1 text-xs ${selectedCampaignId===String(c.id)?"bg-white/20":"bg-white/10"}`} onClick={()=>void loadPackage(String(c.id))}>{String(c.title)}</button>)}</div>
      {campaignPackage ? <div className="mt-3 space-y-1 text-xs"><p><b>Campaign brief:</b> {String((campaignPackage.campaign as Record<string, unknown>)?.objective ?? "-")}</p><p><b>Drafts:</b> {String((campaignPackage.drafts as unknown[]).length)}</p><p><b>Asset plans:</b> {String((campaignPackage.assetPlans as unknown[]).length)}</p><p><b>Missing inputs:</b> {((campaignPackage.missingInputs as string[]) ?? []).join(", ") || "None"}</p><p><b>Ready for render status:</b> {String(campaignPackage.readyForRender)}</p><p><b>Future publish status:</b> disabled</p></div> : <p className="mt-2 text-xs text-zinc-400">Select a campaign to inspect package sections.</p>}
    </section>
  </div>;
}
