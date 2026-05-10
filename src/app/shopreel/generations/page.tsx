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
  const primaryAction = norm(g.status) === "ready" || norm(g.status) === "completed" ? "Package / Publish" : norm(g.status) === "review" ? "Review" : "Continue";
  return <article className="rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.07] to-white/[0.03] p-5 shadow-[0_10px_40px_rgba(0,0,0,.25)] md:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><h3 className="text-lg font-semibold leading-tight text-white md:text-xl">{draft?.title ?? "Untitled generation"}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80 md:text-[15px]">{meta?.prompt ?? draft?.summary ?? "No summary available yet."}</p><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/65 md:text-sm"><span>Updated {time(g.updated_at ?? g.created_at)}</span><span className="text-white/30">•</span><span>Lifecycle: {bucket(norm(g.status))}</span><span className="text-white/30">•</span><span>Platforms: {meta?.platformIds?.join(", ") ?? "Unassigned"}</span></div></div><StatusBadge label={norm(g.status)} variant="neutral" /></div><div className="mt-5 grid gap-2 sm:flex sm:flex-wrap"><Link href={editorPath} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Continue</Link><Link href={`/shopreel/generations/${g.id}`} className="rounded-xl border border-white/25 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white">Review</Link><Link href="/shopreel/publish-center" className="rounded-xl border border-white/25 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white">Package / Publish</Link><Link href={`/shopreel/generations/${g.id}`} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75">View details</Link></div><div className="mt-2 text-xs text-cyan-100/70">Suggested next action: {primaryAction}</div></article>;
}

export default async function ShopReelGenerationsPage() {
  const shopId = await getCurrentShopId();
  const generations = await listStoryGenerations({ shopId, limit: 100 });
  const groups = ["Active", "Needs review", "Ready to publish", "Blocked"] as const;
  return <GlassShell title="Projects" hidePageIntro><div className="space-y-4"><ShopReelPageHero title="Generations" subtitle="Create, review, render, and publish from one queue." actions={[{ label: "Create content", href: "/shopreel/create", primary: true }, { label: "Render queue", href: "/shopreel/render-queue" }]} />{groups.map((name) => { const items = generations.filter((g) => bucket(norm(g.status)) === name); return <ShopReelSurface key={name} title={name} description={`${items.length} items`}>{items.length ? <div className="grid gap-4 lg:grid-cols-2">{items.map((g) => <Card key={g.id} g={g} />)}</div> : <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/65">{name === "Blocked" ? "No failed renders." : name === "Ready to publish" ? "Ready assets will appear here." : "Nothing waiting."}</div>}</ShopReelSurface>; })}</div></GlassShell>;
}
