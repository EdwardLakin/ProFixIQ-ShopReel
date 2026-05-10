export const dynamic = "force-dynamic";
import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { listStoryGenerations } from "@/features/shopreel/story-sources/server/listStoryGenerations";
import { ShopReelPageHero, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import StatusBadge from "@/features/shopreel/components/StatusBadge";

type Generation = Awaited<ReturnType<typeof listStoryGenerations>>[number];
const norm = (s: string | null | undefined) => (s ?? "unknown").toLowerCase();
const time = (v: string | null | undefined) => (v ? new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Unknown");
function bucket(s: string) { if (["failed", "error"].includes(s)) return "Blocked"; if (["draft", "review", "pending"].includes(s)) return "Needs review"; if (["ready", "completed", "published"].includes(s)) return "Ready to publish"; return "Active"; }
function Card({ g }: { g: Generation }) {
  const draft = (g.story_draft as { title?: string; summary?: string } | null) ?? null;
  const meta = (g.generation_metadata as { platformIds?: string[]; output_type?: string; prompt?: string } | null) ?? null;
  const editorPath = getEditorPath(meta?.output_type ?? "video", g.id);
  return <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-base font-semibold text-white">{draft?.title ?? "Untitled generation"}</h3><p className="mt-1 line-clamp-2 text-sm text-white/75">{meta?.prompt ?? draft?.summary ?? "No summary available yet."}</p><p className="mt-2 text-xs text-white/60">Updated {time(g.updated_at ?? g.created_at)} · Platforms: {meta?.platformIds?.join(", ") ?? "Unassigned"}</p></div><StatusBadge label={norm(g.status)} variant="neutral" /></div><div className="mt-4 flex flex-wrap gap-2"><Link href={editorPath} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">Continue work</Link><Link href={`/shopreel/generations/${g.id}`} className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white">Review outputs</Link><button className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/75">Package & publish</button><button className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/75">Duplicate</button><button className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/75">Sync</button></div></article>;
}

export default async function ShopReelGenerationsPage() {
  const shopId = await getCurrentShopId();
  const generations = await listStoryGenerations({ shopId, limit: 100 });
  const groups = ["Active", "Needs review", "Ready to publish", "Blocked"] as const;
  return <GlassShell title="Projects" hidePageIntro><div className="space-y-4"><ShopReelPageHero title="Generations" subtitle="Create, review, render, and publish from one queue." actions={[{ label: "Create content", href: "/shopreel/create", primary: true }, { label: "Render queue", href: "/shopreel/render-queue" }]} />{groups.map((name) => { const items = generations.filter((g) => bucket(norm(g.status)) === name); return <ShopReelSurface key={name} title={name} description={`${items.length} items`}>{items.length ? <div className="grid gap-3 lg:grid-cols-2">{items.map((g) => <Card key={g.id} g={g} />)}</div> : <p className="text-sm text-white/65">No items in this lane.</p>}</ShopReelSurface>; })}</div></GlassShell>;
}
