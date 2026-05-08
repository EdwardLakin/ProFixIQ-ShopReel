export const dynamic = "force-dynamic";
import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { AiCommandInput, AiIntentChip, AiPanel } from "@/features/shopreel/ui/system/AiCommandPrimitives";

type StoryDraft = { title?: unknown; prompt?: unknown };
type RecentGenerationRow = { id: string; status: string | null; created_at: string; story_draft: StoryDraft | null };
const INTENTS = [
  ["Create reel", "/shopreel/create?template=Create%20reel"],
  ["Plan campaign", "/shopreel/create?template=Plan%20campaign"],
  ["Edit draft", "/shopreel/editor"],
  ["Check renders", "/shopreel/render-queue"],
  ["Package for publish", "/shopreel/exports"],
  ["Generate ideas", "/shopreel/ideas"],
] as const;

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const [{ count: drafts = 0 }, { count: review = 0 }, { count: rendering = 0 }, { count: ready = 0 }, { data: recentData }] = await Promise.all([
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["draft", "queued"]),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "review"),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "rendering"),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "ready"),
    supabase.from("shopreel_story_generations").select("id,status,created_at,story_draft").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(8),
  ]);
  const recent: RecentGenerationRow[] = (recentData ?? []).map((row) => ({ id: row.id, status: row.status, created_at: row.created_at, story_draft: row.story_draft && typeof row.story_draft === "object" && !Array.isArray(row.story_draft) ? (row.story_draft as StoryDraft) : null }));

  return <GlassShell title="Command OS" hidePageIntro className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[210px_minmax(0,1fr)_290px]">
      <AiPanel title="Routes">
        <div className="space-y-2 text-sm">{[["Create","/shopreel/create"],["Editor","/shopreel/editor"],["Render Queue","/shopreel/render-queue"],["Library","/shopreel/library"]].map(([l,h]) => <Link key={h} href={h} className="block rounded-xl bg-white/5 px-3 py-2 text-white/75 hover:text-white">{l}</Link>)}</div>
      </AiPanel>
      <div className="space-y-4">
        <AiPanel title="AI Command Center">
          <h1 className="text-3xl font-semibold text-white">Hi, what are we working on today?</h1>
          <p className="mt-2 text-sm text-white/65">Describe intent in natural language. ShopReel routes you to the next best workspace.</p>
          <div className="mt-4"><AiCommandInput readOnly placeholder="Create a high-converting launch reel and prep captions for Instagram + Facebook." /></div>
          <div className="mt-4 flex flex-wrap gap-2">{INTENTS.map(([l,h]) => <AiIntentChip key={l} label={l} href={h} />)}</div>
        </AiPanel>
        <AiPanel title="Dynamic Workspace Stage">
          <div className="grid gap-3 md:grid-cols-3 text-sm">{[
            ["Interpreted intent","Create content"],
            ["Next question","What asset or prompt should seed this draft?"],
            ["Required action","Manual review before render/publish"],
          ].map(([k,v]) => <div key={k} className="rounded-2xl bg-black/30 p-3 text-white/80"><div className="text-xs text-cyan-100/60">{k}</div><div className="mt-1">{v}</div></div>)}</div>
        </AiPanel>
        <AiPanel title="Production Timeline">
          <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-6">{["Idea","Assets","Storyboard","Render","Review","Export"].map((s) => <div key={s} className="rounded-xl bg-white/5 px-3 py-2 text-center text-white/75">{s}</div>)}</div>
        </AiPanel>
      </div>
      <AiPanel title="AI Activity Rail">
        <div className="space-y-2 text-sm text-white/80">
          <div className="rounded-xl bg-white/5 p-2.5">Drafts: <span className="font-semibold">{drafts}</span></div>
          <div className="rounded-xl bg-white/5 p-2.5">Review: <span className="font-semibold">{review}</span></div>
          <div className="rounded-xl bg-white/5 p-2.5">Rendering: <span className="font-semibold">{rendering}</span></div>
          <div className="rounded-xl bg-white/5 p-2.5">Ready: <span className="font-semibold">{ready}</span></div>
        </div>
        <div className="mt-4 space-y-2">{recent.slice(0,5).map((item) => <Link key={item.id} href={`/shopreel/generations/${item.id}`} className="block rounded-xl bg-black/35 p-2 text-xs text-white/75">{typeof item.story_draft?.title === "string" ? item.story_draft.title : "Untitled generation"} · {item.status ?? "unknown"}</Link>)}</div>
      </AiPanel>
    </div>
  </GlassShell>;
}
