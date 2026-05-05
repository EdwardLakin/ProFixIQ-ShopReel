export const dynamic = "force-dynamic";

import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { listStoryGenerations } from "@/features/shopreel/story-sources/server/listStoryGenerations";
import { ShopReelActionRail, ShopReelEmptyState, ShopReelPageHero, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

const STEPS = ["Drafts", "Review", "Processing", "Ready", "Published"];

export default async function ShopReelGenerationsPage() {
  const shopId = await getCurrentShopId();
  const generations = await listStoryGenerations({ shopId, limit: 100 });

  return <GlassShell title="Projects" hidePageIntro><div className="space-y-4"><ShopReelPageHero title="Projects" subtitle="Review drafts, refine content, and move work toward ready-to-export." actions={[{ label: "Create content", href: "/shopreel/create", primary: true }, { label: "Explore ideas", href: "/shopreel/ideas" }]} />
  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-4"><ShopReelSurface title="Project workflow"><div className="grid gap-2 sm:grid-cols-5">{STEPS.map((step)=><div key={step} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center text-xs text-white/75">{step}</div>)}</div></ShopReelSurface><ShopReelSurface title="Project list">{generations.length===0?<ShopReelEmptyState title="No projects yet" description="Create your first draft from media, notes, or an idea." ctaLabel="Create content" ctaHref="/shopreel/create"/>:<div className="grid gap-2">{generations.map((g)=><div key={g.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><div className="text-sm font-medium text-white">{(g.story_draft as {title?:string}|null)?.title ?? "Untitled project"}</div><div className="mt-1 text-xs text-white/60">{g.status}</div><div className="mt-2 flex gap-2"><Link href={`/shopreel/generations/${g.id}`} className="text-xs text-cyan-200">Review</Link><Link href={getEditorPath((g.generation_metadata as {output_type?:string}|null)?.output_type ?? "video", g.id)} className="text-xs text-cyan-200">Edit</Link></div></div>)}</div>}</ShopReelSurface></div><ShopReelActionRail title="Project workflow" items={["Create draft","Review","Process","Download","Publish"]} /></div></div></GlassShell>;
}
