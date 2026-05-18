"use client";

import Link from "next/link";
import { useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { formatPostReviewCopy, resolvePostReviewPublishingState, type PostReviewPayload } from "@/features/shopreel/campaigns/lib/postReview";

type PublishingConnections = {
  facebook: { connected: boolean; label: string | null; pageId: string | null; expiresAt: string | null };
  instagram: { connected: boolean; label: string | null; businessId: string | null; expiresAt: string | null };
};

type QueueResponse = { ok?: boolean; error?: string; itemId?: string; publicationId?: string | null; jobIds?: string[]; message?: string; publishQueueHref?: string };

export default function CampaignPostReviewClient({ payload, imageJobId, campaignId, publishingConnections, publishQueueEnabled }: { payload: PostReviewPayload; imageJobId: string | null; campaignId: string; publishingConnections: PublishingConnections; publishQueueEnabled: boolean; }) {
  const [copied, setCopied] = useState("");
  const [queueStatus, setQueueStatus] = useState<string>("");
  const [queueError, setQueueError] = useState<string>("");
  const [isQueueing, setIsQueueing] = useState(false);
  const [queuedPublicationId, setQueuedPublicationId] = useState<string | null>(null);
  const [queuedJobIds, setQueuedJobIds] = useState<string[]>([]);
  const [publishQueueHref, setPublishQueueHref] = useState("/shopreel/publish-queue");

  const publishingState = resolvePostReviewPublishingState({ publishingConnections, publishQueueEnabled });
  const queueAlreadySent = Boolean(queuedPublicationId || queuedJobIds.length);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(`${label}: Copied.`);
    window.setTimeout(() => setCopied(""), 1200);
  }

  async function sendToPublishQueue() {
    setQueueStatus("");
    setQueueError("");
    setIsQueueing(true);
    const res = await fetch(`/api/shopreel/campaigns/items/${payload.sourceItemId}/publish-queue`, { method: "POST" });
    const json = await res.json().catch(() => ({})) as QueueResponse;
    setIsQueueing(false);
    if (!res.ok || !json.ok) {
      setQueueError(json.error ?? "Failed to send to publish queue.");
      return;
    }
    setQueuedPublicationId(json.publicationId ?? null);
    setQueuedJobIds(json.jobIds ?? []);
    if (json.publishQueueHref) setPublishQueueHref(json.publishQueueHref);
    setQueueStatus(json.message ?? "Post sent to publish queue.");
  }

  return <section className="space-y-4 rounded-[1.2rem] border border-white/10 bg-slate-950/85 p-5">
    <h2 className="text-2xl font-semibold">Review post</h2>
    {copied ? <p className="text-xs text-emerald-300">{copied}</p> : null}
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">A. Visual</h3>
      {payload.imageUrl ? <div className="mt-2 space-y-2"><img src={payload.imageUrl} alt="Generated ad" className="max-h-96 rounded border border-white/10" /><a className="text-sm text-cyan-300" href={payload.imageUrl} target="_blank" rel="noreferrer">Open/download image</a></div> : <p className="mt-2 text-sm">No image generated yet. <Link className="text-cyan-300" href={`/shopreel/campaigns/${campaignId}`}>Back to campaign</Link></p>}
    </div>

    <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/5 p-4">
      <h3 className="font-semibold">Recommended next step</h3>
      <p className="mt-2 text-sm text-white/80">{publishingState.recommendedNextStep}</p>
    </div>

    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">B. Facebook/Instagram post</h3><textarea defaultValue={payload.facebookPost || payload.caption} className="mt-2 min-h-40 w-full rounded border border-white/10 bg-black/25 p-2" /><GlassButton className="mt-2" variant="ghost" onClick={() => void copy("Post text", payload.facebookPost || payload.caption)}>Copy post text</GlassButton></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">C. CTA</h3><ul className="mt-2 list-disc pl-5 text-sm">{payload.ctaOptions.map((cta) => <li key={cta}>{cta}</li>)}</ul><GlassButton className="mt-2" variant="ghost" onClick={() => void copy("CTA options", payload.ctaOptions.join("\n"))}>Copy CTA options</GlassButton></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">D. Comment replies</h3><div className="mt-2 space-y-2">{payload.commentReplies.map((reply, idx) => <div key={`${reply}-${idx}`} className="rounded border border-white/10 p-2"><p className="text-sm">{reply}</p><GlassButton className="mt-1" variant="ghost" onClick={() => void copy(`Reply ${idx + 1}`, reply)}>Copy</GlassButton></div>)}</div><GlassButton className="mt-2" variant="ghost" onClick={() => void copy("Comment replies", payload.commentReplies.join("\n"))}>Copy comment replies</GlassButton></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">E. Reel script</h3><p className="mt-2 whitespace-pre-wrap text-sm">{payload.reelScript || "No reel script provided."}</p></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">F. Final actions</h3>
      <div className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
        <h4 className="font-medium">Publishing destinations</h4>
        {publishingState.hasConnectedDestination ? <div className="mt-2 space-y-2">
          {publishingConnections.facebook.connected ? <p>Facebook: Connected ({publishingConnections.facebook.label ?? "Page connected"})</p> : null}
          {publishingConnections.instagram.connected ? <p>Instagram: Connected ({publishingConnections.instagram.label ?? "Business account connected"})</p> : null}
          {publishingState.queueBlockedReason ? <p className="text-amber-300">{publishingState.queueBlockedReason}</p> : null}
        </div> : <div className="mt-2 space-y-2"><p>No connected publishing account.</p><Link className="text-cyan-300" href="/shopreel/settings#connections">Connect Facebook/Instagram</Link></div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {publishingState.publishCtaEnabled ? <GlassButton onClick={() => void sendToPublishQueue()} disabled={isQueueing || queueAlreadySent}>{isQueueing ? "Sending…" : queueAlreadySent ? "Queued for publishing" : "Send to publish queue"}</GlassButton> : <GlassButton disabled>Send to publish queue</GlassButton>}
        <GlassButton variant={publishingState.manualPrimary ? "primary" : "ghost"} onClick={() => void copy("Post + image package", formatPostReviewCopy(payload))}>Copy post + image</GlassButton>
        <Link href={`/shopreel/campaigns/${campaignId}`}><GlassButton variant="ghost">Back to campaign</GlassButton></Link>
        <Link href={`/shopreel/campaigns/items/${payload.sourceItemId}`}><GlassButton variant="ghost">Generate video version</GlassButton></Link>
        {!publishingState.hasConnectedDestination ? <Link href="/shopreel/settings#connections"><GlassButton variant="ghost">Connect Facebook/Instagram</GlassButton></Link> : null}
      </div>
      {queueStatus ? <p className="mt-2 text-xs text-emerald-300">{queueStatus}</p> : null}
      {queueAlreadySent ? <p className="mt-1 text-xs text-white/80">Queued for publishing{queuedPublicationId ? ` (publication ${queuedPublicationId})` : ""}.</p> : null}
      {queueError ? <p className="mt-2 text-xs text-rose-300">{queueError}</p> : null}
      {(queueAlreadySent || publishingState.publishCtaEnabled) ? <Link className="mt-2 inline-block text-xs text-cyan-300" href={publishQueueHref}>Open publish queue</Link> : null}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
        <h4 className="font-medium">Manual post package</h4>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-white/80">
          <li>Copy post text</li>
          <li>Open/download image</li>
          <li>Paste into Facebook or Instagram</li>
          <li>Post or boost</li>
        </ol>
      </div>
    </div>
  </section>;
}
