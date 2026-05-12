"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";

type ReviewPriority = "high_priority" | "active_proposal" | "history";

type ReviewItem = {
  id: string;
  campaignId: string | null;
  campaignTitle: string;
  decisionTitle: string;
  aiSummary: string;
  decisionNeeded: string;
  whyItMatters: string;
  nextStep: string;
  confidence: number | null;
  priority: ReviewPriority;
  status: string;
  workspaceHref: string;
};

type AdaptiveMemory = { learnedNotices: string[]; tasteSummary: string[]; continuityNotice: string | null };

export default function ReviewInboxClient({ items, adaptiveMemory }: { items: ReviewItem[]; adaptiveMemory: AdaptiveMemory }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refineReason, setRefineReason] = useState<Record<string, string>>({});
  const router = useRouter();

  const grouped = useMemo(() => {
    return {
      highPriority: items.filter((item) => item.priority === "high_priority"),
      activeProposals: items.filter((item) => item.priority === "active_proposal"),
      history: items.filter((item) => item.priority === "history"),
    };
  }, [items]);

  async function decision(itemId: string, action: "approve" | "reject" | "refine") {
    const endpointAction = action === "approve" ? "approve" : "reject";
    try {
      setBusyId(`${action}:${itemId}`);
      setError(null);
      const reason = refineReason[itemId]?.trim() || null;
      const res = await fetch(`/api/shopreel/agents/tasks/${itemId}/${endpointAction}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          metadata: {
            source: "review_inbox",
            decisionMode: action,
            refinementSignal: action !== "approve" ? reason : null,
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) throw new Error(json.error ?? "Unable to save your decision.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed.");
    } finally {
      setBusyId(null);
    }
  }

  const Section = ({ title, description, data }: { title: string; description: string; data: ReviewItem[] }) => (
    <GlassCard label="Review inbox" title={title} description={description} strong>
      <div className="grid gap-3">
        {data.length === 0 ? <p className="text-sm text-white/65">Nothing waiting here right now.</p> : data.map((item) => (
          <article key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <GlassBadge tone={item.priority === "high_priority" ? "copper" : "default"}>{item.priority === "high_priority" ? "Needs your decision now" : "AI proposal ready"}</GlassBadge>
              {item.confidence !== null ? <GlassBadge tone="muted">Confidence {item.confidence}</GlassBadge> : null}
            </div>
            <h3 className="mt-2 text-base font-semibold text-white">{item.decisionTitle}</h3>
            <p className="mt-1 text-sm text-white/70">{item.aiSummary}</p>
            {adaptiveMemory.continuityNotice ? <p className="mt-2 text-xs text-cyan-100/80">{adaptiveMemory.continuityNotice}</p> : null}
            <div className="mt-3 grid gap-1 text-sm">
              <p><span className="text-white/55">Campaign:</span> <span className="text-white">{item.campaignTitle}</span></p>
              <p><span className="text-white/55">Decision needed:</span> <span className="text-white">{item.decisionNeeded}</span></p>
              <p><span className="text-white/55">Why this matters:</span> <span className="text-white">{item.whyItMatters}</span></p>
              <p><span className="text-white/55">After approval:</span> <span className="text-white">{item.nextStep}</span></p>
            </div>
            <textarea
              value={refineReason[item.id] ?? ""}
              onChange={(event) => setRefineReason((prev) => ({ ...prev, [item.id]: event.target.value }))}
              className="mt-3 w-full rounded-xl border border-white/15 bg-black/30 p-2 text-sm"
              placeholder="Optional refinement guidance (e.g., less corporate, more energy, soften tone)."
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <GlassButton variant="secondary" onClick={() => void decision(item.id, "approve")} disabled={busyId === `approve:${item.id}`}>Approve</GlassButton>
              <GlassButton variant="ghost" onClick={() => void decision(item.id, "reject")} disabled={busyId === `reject:${item.id}`}>Reject</GlassButton>
              <GlassButton variant="ghost" onClick={() => void decision(item.id, "refine")} disabled={busyId === `refine:${item.id}`}>Request changes</GlassButton>
              <Link href={item.workspaceHref} className="text-xs text-cyan-100/90 underline decoration-dotted underline-offset-2">Open campaign workspace</Link>
            </div>
          </article>
        ))}
      </div>
    </GlassCard>
  );

  return (
    <div className="grid gap-4">
      {(adaptiveMemory.learnedNotices.length > 0 || adaptiveMemory.tasteSummary.length > 0) ? <GlassCard label="Adaptive memory" title="AI is learning your creative taste" description="Subtle preference continuity from your approvals, rejections, and refinements." strong>
        <div className="grid gap-3">
          {adaptiveMemory.learnedNotices.map((notice) => <p key={notice} className="text-sm text-white/75">{notice}</p>)}
          {adaptiveMemory.tasteSummary.length > 0 ? <div className="flex flex-wrap gap-2">{adaptiveMemory.tasteSummary.map((signal) => <GlassBadge key={signal} tone="muted">{signal}</GlassBadge>)}</div> : null}
        </div>
      </GlassCard> : null}
      <Section title="High-priority decisions" description="Approvals and blockers that unlock campaign momentum right now." data={grouped.highPriority} />
      <Section title="Active AI proposals" description="AI has prepared options and is waiting for your direction." data={grouped.activeProposals} />
      <Section title="Recent review activity" description="Previously resolved supervision decisions for continuity." data={grouped.history} />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
