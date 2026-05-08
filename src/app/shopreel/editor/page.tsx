export const dynamic = "force-dynamic";
import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { AiPanel } from "@/features/shopreel/ui/system/AiCommandPrimitives";

export default async function ShopReelEditorHubPage() {
  const supabase = createAdminClient();
  const { data: generations } = await supabase.from("shopreel_story_generations").select("id,status,created_at,story_draft").order("created_at", { ascending: false }).limit(12);
  const items = generations ?? [];
  return <GlassShell title="AI Creative Workstation" hidePageIntro>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <AiPanel title="Workspace Stage"><div className="rounded-2xl bg-black/40 p-4 text-white/80">Central preview stage. Timeline and scene controls remain in existing editor routes.</div><div className="mt-3 flex gap-2"><Link href="/shopreel/create" className="rounded-xl bg-cyan-400/20 px-3 py-2 text-sm text-cyan-100">Generate draft</Link><Link href="/shopreel/generations" className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80">Open review queue</Link></div></AiPanel>
        <AiPanel title="Recent Sessions">{items.length===0?<div className="text-sm text-white/60">No sessions yet.</div>:<div className="space-y-2">{items.map((item)=><Link key={item.id} href={`/shopreel/editor/video/${item.id}`} className="block rounded-xl bg-white/5 p-3 text-sm text-white/80">{(item.story_draft as {title?: string}|null)?.title ?? "Untitled generation"} · {item.status ?? "unknown"}</Link>)}</div>}</AiPanel>
      </div>
      <AiPanel title="AI Operator Panel"><div className="space-y-2 text-xs text-white/70"><div className="rounded-xl bg-white/5 p-2">Next question: which scene needs revision?</div><div className="rounded-xl bg-white/5 p-2">Render and publish remain manual approval steps.</div></div></AiPanel>
    </div>
  </GlassShell>;
}
