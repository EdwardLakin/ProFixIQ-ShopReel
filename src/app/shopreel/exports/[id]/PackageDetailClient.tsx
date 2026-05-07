"use client";
import { useState } from "react";

type Props = { id: string; caption?: string; hashtags: string[]; title?: string; description?: string; approvalState: string; hasVideo: boolean; hasThumb: boolean; videoUrl?: string; thumbUrl?: string };

export default function PackageDetailClient(props: Props) {
  const [approval, setApproval] = useState(props.approvalState);
  const [message, setMessage] = useState<string | null>(null);
  const copy = async (value: string | undefined, label: string) => {
    if (!value) return setMessage(`${label} is empty`);
    await navigator.clipboard.writeText(value);
    setMessage(`${label} copied`);
  };
  const transition = async (toState: string) => {
    const res = await fetch(`/api/shopreel/exports/${props.id}/approval`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ toState }) });
    const json = await res.json();
    if (!res.ok) return setMessage(json.error ?? "Transition failed");
    setApproval(json.toState);
    setMessage(`State updated to ${json.toState}`);
  };

  return <div className="space-y-3">
    {message ? <p className="text-xs text-cyan-200">{message}</p> : null}
    <div className="flex flex-wrap gap-2 text-xs">
      <button className="rounded border border-white/20 px-2 py-1" onClick={() => copy(props.caption, "Caption")}>Copy caption</button>
      <button className="rounded border border-white/20 px-2 py-1" onClick={() => copy(props.hashtags.join(" "), "Hashtags")}>Copy hashtags</button>
      <button className="rounded border border-white/20 px-2 py-1" onClick={() => copy(props.title, "Title")}>Copy title</button>
      <button className="rounded border border-white/20 px-2 py-1" onClick={() => copy(props.description, "Description")}>Copy description</button>
      {props.hasVideo && props.videoUrl ? <a className="rounded border border-emerald-400/40 px-2 py-1" href={props.videoUrl} target="_blank">Download video</a> : null}
      {props.hasThumb && props.thumbUrl ? <a className="rounded border border-emerald-400/40 px-2 py-1" href={props.thumbUrl} target="_blank">Open thumbnail</a> : null}
    </div>
    <div className="flex flex-wrap gap-2 text-xs">
      {approval === "draft" ? <button className="rounded border border-white/20 px-2 py-1" onClick={() => transition("needs_review")}>Mark reviewed</button> : null}
      {approval === "needs_review" ? <button className="rounded border border-white/20 px-2 py-1" onClick={() => transition("approved")}>Mark approved</button> : null}
      {approval === "approved" ? <button className="rounded border border-white/20 px-2 py-1" onClick={() => transition("exported")}>Mark exported</button> : null}
    </div>
  </div>;
}
