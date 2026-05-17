"use client";

import Link from "next/link";
import { useState } from "react";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { formatPostReviewCopy, type PostReviewPayload } from "@/features/shopreel/campaigns/lib/postReview";

export default function CampaignPostReviewClient({ payload, imageJobId, campaignId }: { payload: PostReviewPayload; imageJobId: string | null; campaignId: string; }) {
  const [copied, setCopied] = useState("");
  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(`${label}: Copied.`);
    window.setTimeout(() => setCopied(""), 1200);
  }

  return <section className="space-y-4 rounded-[1.2rem] border border-white/10 bg-slate-950/85 p-5">
    <h2 className="text-2xl font-semibold">Review post</h2>
    {copied ? <p className="text-xs text-emerald-300">{copied}</p> : null}
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">A. Visual</h3>
      {payload.imageUrl ? <div className="mt-2 space-y-2"><img src={payload.imageUrl} alt="Generated ad" className="max-h-96 rounded border border-white/10" /><a className="text-sm text-cyan-300" href={payload.imageUrl} target="_blank" rel="noreferrer">Open image</a></div> : <p className="mt-2 text-sm">No image generated yet. <Link className="text-cyan-300" href={`/shopreel/campaigns/${campaignId}`}>Back to campaign workspace</Link></p>}
    </div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">B. Facebook/Instagram post</h3><textarea defaultValue={payload.facebookPost || payload.caption} className="mt-2 min-h-40 w-full rounded border border-white/10 bg-black/25 p-2" /><GlassButton className="mt-2" variant="ghost" onClick={() => void copy("Facebook post", payload.facebookPost || payload.caption)}>Copy Facebook post</GlassButton></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">C. CTA</h3><ul className="mt-2 list-disc pl-5 text-sm">{payload.ctaOptions.map((cta) => <li key={cta}>{cta}</li>)}</ul><GlassButton className="mt-2" variant="ghost" onClick={() => void copy("CTA options", payload.ctaOptions.join("\n"))}>Copy CTA options</GlassButton></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">D. Comment replies</h3><div className="mt-2 space-y-2">{payload.commentReplies.map((reply, idx) => <div key={`${reply}-${idx}`} className="rounded border border-white/10 p-2"><p className="text-sm">{reply}</p><GlassButton className="mt-1" variant="ghost" onClick={() => void copy(`Reply ${idx + 1}`, reply)}>Copy</GlassButton></div>)}</div><GlassButton className="mt-2" variant="ghost" onClick={() => void copy("Comment replies", payload.commentReplies.join("\n"))}>Copy comment replies</GlassButton></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">E. Reel script</h3><p className="mt-2 whitespace-pre-wrap text-sm">{payload.reelScript || "No reel script provided."}</p></div>
    <div className="rounded-xl border border-white/10 p-4"><h3 className="font-semibold">F. Final actions</h3><div className="mt-2 flex flex-wrap gap-2"><GlassButton variant="ghost" onClick={() => void copy("Full post package", formatPostReviewCopy(payload))}>Copy full post package</GlassButton>{payload.imageUrl ? <a href={payload.imageUrl} download><GlassButton variant="ghost">Download image</GlassButton></a> : null}<Link href={`/shopreel/campaigns/${campaignId}`}><GlassButton variant="ghost">Back to campaign</GlassButton></Link><Link href={`/shopreel/campaigns/items/${payload.sourceItemId}`}><GlassButton variant="ghost">Open video production</GlassButton></Link>{imageJobId ? <Link href={`/shopreel/campaigns/${campaignId}?panel=production&item=${payload.sourceItemId}`}><GlassButton variant="ghost">Generate video from this image</GlassButton></Link> : null}<GlassButton variant="ghost" disabled>Publish/export coming next</GlassButton></div><p className="mt-2 text-xs text-white/60">Optional: turn this image into a video.</p></div>
  </section>;
}
