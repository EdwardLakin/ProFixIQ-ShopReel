import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { ShopReelEmptyState, ShopReelPageHero, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import StatusBadge from "@/features/shopreel/components/StatusBadge";

export default async function ShopReelEditorHubPage() {
  const supabase = createAdminClient();
  const { data: generations } = await supabase
    .from("shopreel_story_generations")
    .select("id, status, created_at, updated_at, story_draft, generation_metadata")
    .order("created_at", { ascending: false })
    .limit(12);

  const items = generations ?? [];

  return (
    <GlassShell title="Editor" hidePageIntro>
      <div className="space-y-4">
        <ShopReelPageHero title="Editor" subtitle="Shape scenes, tighten storyboards, and move drafts to render-ready without leaving the workflow." actions={[{ label: "Create content", href: "/shopreel/create", primary: true }, { label: "Open generations", href: "/shopreel/generations" }]} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          <ShopReelSurface title="Timeline workspace" description="Real timeline surface with guided next actions when media or scenes are missing.">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="mb-3 flex items-center justify-between"><p className="text-sm text-white/85">Scene lane</p><Link href="/shopreel/create" className="rounded-lg border border-cyan-300/40 px-2.5 py-1 text-xs text-cyan-200">Add source media</Link></div>
              <div className="h-40 rounded-xl border border-dashed border-white/20 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_24px] p-3">
                <div className="grid h-full gap-2 sm:grid-cols-2">
                  {[
                    "Generate storyboard",
                    "Create first scene",
                    "Render preview unavailable",
                    "Add source media",
                  ].map((item) => (
                    <div key={item} className="flex items-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs text-white/70">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </ShopReelSurface>

          <ShopReelSurface title="Inspector" description="Metadata, status, and output context for the selected project.">
            <div className="space-y-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/80">No clip selected. Pick a generation to inspect scene-level controls.</div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/65">Render preview unavailable until first scene is created and queued.</div>
              <div className="flex flex-wrap gap-2"><Link href="/shopreel/generations" className="rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-white/85">Open queue</Link><Link href="/shopreel/create" className="rounded-lg bg-gradient-to-r from-violet-500 to-cyan-400 px-2.5 py-1.5 text-xs font-semibold text-white">Generate storyboard</Link></div>
            </div>
          </ShopReelSurface>
        </div>

        <ShopReelSurface title="Recent editor sessions" description="Open persisted generations directly into the editor.">
          {items.length === 0 ? <ShopReelEmptyState title="No editable projects yet" description="Create a draft first, then return here to start scene assembly." /> : <div className="grid gap-2">{items.map((item:any) => (<Link key={item.id} href={`/shopreel/editor/video/${item.id}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-cyan-300/40"><div className="flex items-center justify-between"><p className="text-sm text-white">{(item.story_draft as any)?.title ?? "Untitled generation"}</p><StatusBadge label={item.status ?? "unknown"} variant={item.status === "ready" ? "good" : item.status === "failed" ? "warn" : "neutral"} /></div><p className="mt-1 text-xs text-white/60">Opened {new Date(item.created_at).toLocaleDateString()}</p></Link>))}</div>}
        </ShopReelSurface>
      </div>
    </GlassShell>
  );
}
