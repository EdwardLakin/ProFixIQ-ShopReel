"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { SHOPREEL_PLATFORM_PRESETS } from "@/features/shopreel/platforms/presets";
import type { ShopReelReviewDraft } from "@/features/shopreel/review/reviewDraft";

type Props = { draft: ShopReelReviewDraft };

export default function ReviewWorkspaceClient({ draft }: Props) {
  const [conceptTitle, setConceptTitle] = useState(draft.conceptTitle ?? "");
  const [hook, setHook] = useState(draft.hook ?? "");
  const [script, setScript] = useState(draft.script ?? "");
  const [voiceover, setVoiceover] = useState(draft.voiceover ?? "");
  const [captionText, setCaptionText] = useState(draft.captionText ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [startingRender, setStartingRender] = useState(false);
  const router = useRouter();

  async function saveDraft() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/shopreel/generations/${draft.generationId}/draft`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storyDraft: {
            title: conceptTitle,
            hook,
            scriptText: script,
            voiceoverText: voiceover,
            caption: captionText,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save draft edits");
      setMessage("Draft saved.");
    } catch {
      setMessage("Unable to save right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }



  async function startRender() {
    setStartingRender(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/shopreel/generations/${draft.generationId}/render`, { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; error?: string; renderJobsUrl?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Failed to start render");
      router.push(json.renderJobsUrl ?? "/shopreel/render-jobs");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start render right now.");
    } finally {
      setStartingRender(false);
    }
  }

  const platformLabels = draft.platforms.map((id) => {
    const preset = SHOPREEL_PLATFORM_PRESETS.find((item) => item.id === id);
    return preset?.label ?? id;
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <GlassCard label="Source" title="Draft context" strong>
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs uppercase text-white/50">Original prompt</div>
            <p className="mt-1 whitespace-pre-wrap">{draft.prompt || "—"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <GlassBadge tone="default">{draft.status}</GlassBadge>
            {platformLabels.map((label) => (
              <GlassBadge key={label} tone="muted">{label}</GlassBadge>
            ))}
          </div>
          {draft.audience ? <p><span className="text-white/60">Audience:</span> {draft.audience}</p> : null}
          {draft.manualAssetId ? (
            <p><span className="text-white/60">Manual asset:</span> {draft.manualAssetId}</p>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard label="Next" title="Render step" description="After reviewing, continue to render queue/start placeholder.">
        <div className="space-y-3 text-sm text-white/80">
          <p>Save your draft updates, then start a real render job when ready.</p>
          <div className="flex gap-2">
            <GlassButton onClick={startRender} disabled={startingRender}>{startingRender ? "Starting render…" : "Start render"}</GlassButton>
            <Link href="/shopreel/render-jobs"><GlassButton variant="ghost">Go to render jobs</GlassButton></Link>
            <Link href={`/shopreel/generations/${draft.generationId}`}><GlassButton variant="ghost">Open generation detail</GlassButton></Link>
          </div>
        </div>
      </GlassCard>

      <GlassCard label="Edit" title="Review fields" strong className="xl:col-span-2">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase text-white/55">Concept title</span>
            <input className="w-full rounded-xl border border-white/20 bg-white/5 p-2" value={conceptTitle} onChange={(e) => setConceptTitle(e.target.value)} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase text-white/55">Hook</span>
            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={2} value={hook} onChange={(e) => setHook(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase text-white/55">Script</span>
            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={7} value={script} onChange={(e) => setScript(e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase text-white/55">Voiceover</span>
            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={7} value={voiceover} onChange={(e) => setVoiceover(e.target.value)} />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase text-white/55">Caption</span>
            <textarea className="w-full rounded-xl border border-white/20 bg-white/5 p-2" rows={3} value={captionText} onChange={(e) => setCaptionText(e.target.value)} />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <GlassButton onClick={saveDraft} disabled={saving}>{saving ? "Saving…" : "Save draft updates"}</GlassButton>
          {message ? <span className="text-sm text-white/70">{message}</span> : null}
        </div>
      </GlassCard>
    </div>
  );
}
