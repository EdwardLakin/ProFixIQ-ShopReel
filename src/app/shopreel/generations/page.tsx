export const dynamic = "force-dynamic";

import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { listStoryGenerations } from "@/features/shopreel/story-sources/server/listStoryGenerations";
import { ShopReelEmptyState, ShopReelPageHero, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import StatusBadge from "@/features/shopreel/components/StatusBadge";

type Generation = Awaited<ReturnType<typeof listStoryGenerations>>[number];

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "unknown").toLowerCase();
}

function getBucket(status: string) {
  if (["queued", "processing", "rendering", "in_progress"].includes(status)) return "in-progress";
  if (["failed", "error"].includes(status)) return "failed";
  if (["draft", "review", "pending"].includes(status)) return "drafts";
  return "completed";
}

function relativeTime(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const delta = Date.now() - date.getTime();
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function variantForStatus(status: string): "neutral" | "good" | "warn" {
  if (["ready", "completed", "published"].includes(status)) return "good";
  if (["failed", "error"].includes(status)) return "warn";
  return "neutral";
}

function GenerationCard({ generation }: { generation: Generation }) {
  const draft = generation.story_draft as { title?: string; summary?: string; duration_seconds?: number } | null;
  const metadata = generation.generation_metadata as {
    output_type?: string;
    provider?: string;
    platformIds?: string[];
    prompt?: string;
    duration_seconds?: number;
    thumbnail_url?: string;
  } | null;
  const status = normalizeStatus(generation.status);
  const duration = metadata?.duration_seconds ?? draft?.duration_seconds;
  const title = draft?.title ?? "Untitled generation";
  const prompt = metadata?.prompt ?? draft?.summary ?? "No prompt summary available yet.";
  const editorPath = getEditorPath(metadata?.output_type ?? "video", generation.id);

  return (
    <Link href={`/shopreel/generations/${generation.id}`} className="group block rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-cyan-300/40 hover:bg-white/[0.04]">
      <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)_auto] md:items-center">
        <div className="h-24 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/60 p-2 text-[11px] text-white/55">
          <div className="mb-2 text-white/70">Preview</div>
          <div className="line-clamp-3">{prompt}</div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="line-clamp-2 text-xs text-white/65">{prompt}</p>
          <div className="flex flex-wrap gap-2 text-[11px] text-white/55">
            <span>Platforms: {metadata?.platformIds?.length ? metadata.platformIds.join(", ") : "Unassigned"}</span>
            <span>Provider: {metadata?.provider ?? "Unspecified"}</span>
            <span>Duration: {duration ? `${duration}s` : "Unknown"}</span>
            <span>Updated: {relativeTime(generation.updated_at ?? generation.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:flex-col md:items-end">
          <StatusBadge label={status} variant={variantForStatus(status)} />
          <div className="flex gap-2 text-xs">
            <span className="text-cyan-200">Open</span>
            <Link href={editorPath} className="text-violet-200">Edit</Link>
            <span className="text-white/70">Duplicate</span>
            <span className="text-white/70">Sync</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function ShopReelGenerationsPage() {
  const shopId = await getCurrentShopId();
  const generations = await listStoryGenerations({ shopId, limit: 100 });

  const buckets = { "in-progress": [] as Generation[], completed: [] as Generation[], failed: [] as Generation[], drafts: [] as Generation[] };
  for (const g of generations) buckets[getBucket(normalizeStatus(g.status)) as keyof typeof buckets].push(g);

  const today = new Date();
  const completedToday = buckets.completed.filter((g) => {
    const updated = new Date(g.updated_at ?? g.created_at);
    return updated.toDateString() === today.toDateString();
  }).length;

  return <GlassShell title="Projects" hidePageIntro><div className="space-y-4"><ShopReelPageHero title="Generations" subtitle="Operational cockpit for active renders, retries, and ready assets." actions={[{ label: "Create content", href: "/shopreel/create", primary: true }, { label: "Open render queue", href: "/shopreel/render-queue" }]} /><ShopReelSurface title="Queue health"><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[{label:"Active renders",value:buckets["in-progress"].length},{label:"Queued jobs",value:generations.filter((g)=>normalizeStatus(g.status)==="queued").length},{label:"Failures",value:buckets.failed.length},{label:"Completed today",value:completedToday}].map((m)=><div key={m.label} className="rounded-xl border border-white/10 bg-black/25 p-3"><p className="text-xs text-white/60">{m.label}</p><p className="mt-1 text-2xl font-semibold text-white">{m.value}</p></div>)}</div></ShopReelSurface>
{([ ["In progress", buckets["in-progress"]],["Recently completed", buckets.completed],["Failed", buckets.failed],["Drafts", buckets.drafts] ] as const).map(([label,items])=> <ShopReelSurface key={label} title={label} description={`${items.length} item${items.length===1?"":"s"}`}>{items.length===0?<ShopReelEmptyState title={`No ${label.toLowerCase()} jobs`} description="This section fills automatically as persisted generation states update."/>:<div className="grid gap-2">{items.map((g)=><GenerationCard key={g.id} generation={g} />)}</div>}</ShopReelSurface>)}
</div></GlassShell>;
}
