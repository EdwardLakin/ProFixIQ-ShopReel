"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ShopReelLibraryItem } from "@/features/shopreel/library/libraryItem";
import type { ShopReelPlatformId } from "@/features/shopreel/platforms/presets";

const PLATFORM_LABELS: Record<ShopReelPlatformId, string> = { instagram_reels: "Instagram", facebook_reels: "Facebook", tiktok: "TikTok", youtube_shorts: "YouTube Shorts" };

type Props = { items: ShopReelLibraryItem[]; resultLimit: number };

export default function LibraryIndexClient({ items, resultLimit }: Props) {
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => items.filter((item) => {
    const statusPass = status === "all" || (status === "draft" && ["draft", "reviewed"].includes(item.status)) || (status === "rendering" && ["render_queued", "rendering"].includes(item.status)) || (status === "ready" && ["render_ready", "export_ready"].includes(item.status)) || (status === "exported" && ["exported", "posted"].includes(item.status)) || (status === "failed" && ["render_failed", "failed"].includes(item.status));
    const platformPass = platform === "all" || item.platforms.includes(platform as ShopReelPlatformId);
    const text = `${item.title ?? ""} ${item.prompt ?? ""} ${item.captionText ?? ""} ${item.hashtags.join(" ")}`.toLowerCase();
    const textPass = query.trim().length === 0 || text.includes(query.toLowerCase());
    return statusPass && platformPass && textPass;
  }), [items, platform, query, status]);

  return <div className="space-y-4">
    <div className="grid gap-3 md:grid-cols-4">
      <select className="rounded border border-white/20 bg-black/20 p-2" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="draft">Drafts</option><option value="rendering">Rendering</option><option value="ready">Ready to export</option><option value="exported">Exported</option><option value="failed">Failed</option></select>
      <select className="rounded border border-white/20 bg-black/20 p-2" value={platform} onChange={(e) => setPlatform(e.target.value)}><option value="all">All platforms</option><option value="instagram_reels">Instagram</option><option value="facebook_reels">Facebook</option><option value="tiktok">TikTok</option><option value="youtube_shorts">YouTube Shorts</option></select>
      <input className="rounded border border-white/20 bg-black/20 p-2 md:col-span-2" placeholder="Search title, prompt, caption, hashtags" value={query} onChange={(e) => setQuery(e.target.value)} />
    </div>
    <div className="text-xs text-white/60">Showing {filtered.length} of {items.length} recent records (limit {resultLimit}).</div>
    <div className="grid gap-3">{filtered.map((item) => <article key={item.id} className="rounded border border-white/15 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2"><h3 className="font-medium">{item.title ?? "Untitled"}</h3><span className="text-xs rounded border border-white/20 px-2 py-0.5">{item.statusLabel}</span></div>
      <p className="text-sm text-white/75">{item.prompt ?? item.captionText ?? "No prompt or caption available."}</p>
      <div className="text-xs text-white/65">Platforms: {item.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}</div>
      <div className="text-xs text-white/65">Created: {item.createdAt ?? "—"} · Updated: {item.updatedAt ?? "—"}{item.exportedAt ? ` · Exported: ${item.exportedAt}` : ""}</div>
      <div className="flex gap-2"><Link className="underline" href={item.primaryActionHref}>{item.primaryActionLabel}</Link>{item.secondaryActionHref ? <Link className="underline text-white/75" href={item.secondaryActionHref}>Secondary</Link> : null}</div>
    </article>)}</div>
  </div>;
}
