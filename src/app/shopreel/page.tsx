import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

const TEMPLATES = ["Promote a product", "Explain a service", "Make a short-form reel", "Repurpose a video", "Write a blog post", "Build a campaign"];

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();

  const [{ count: drafts = 0 }, { count: review = 0 }, { count: rendering = 0 }, { count: ready = 0 }, { data: recentData }] = await Promise.all([
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["draft", "queued"]),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "review"),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "rendering"),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "ready"),
    supabase.from("shopreel_story_generations").select("id, status, created_at").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(5),
  ]);

    const recent = recentData ?? [];

  return (
    <GlassShell eyebrow="Home" title="Your AI content engine" subtitle="Upload media, describe the outcome, and generate polished videos, posts, blogs, and captions.">
      <GlassCard title="Create content from anything" description="Use one brief to generate platform-ready marketing content." strong>
        <div className="rounded-2xl border border-white/15 p-4 text-sm text-white/80">Turn these clips into a 30-second launch reel with captions and creator-style pacing.</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/shopreel/create"><GlassButton variant="primary">Create new content</GlassButton></Link>
          <Link href="/shopreel/upload"><GlassButton variant="secondary">Upload media</GlassButton></Link>
          <Link href="/shopreel/opportunities"><GlassButton variant="ghost">Explore ideas</GlassButton></Link>
        </div>
      </GlassCard>

      <div className="grid gap-3 md:grid-cols-5">
        {[ ["Drafts", drafts], ["In review", review], ["Processing", rendering], ["Ready", ready], ["Published", 0] ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3"><div className="text-xs text-white/60">{label}</div><div className="text-xl font-semibold">{value}</div></div>
        ))}
      </div>

      <GlassCard title="Start with a goal" description="Template-driven starting points for creators, brands, and teams.">
        <div className="grid gap-2 md:grid-cols-3">{TEMPLATES.map((template) => <Link key={template} href={`/shopreel/create?template=${encodeURIComponent(template)}`} className="rounded-xl border border-white/10 p-3 text-sm hover:bg-white/[0.04]">{template}</Link>)}</div>
      </GlassCard>

      <GlassCard title="Recent projects" description="Continue work in progress and ship faster.">
        {recent.length === 0 ? <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/75">No projects yet. Upload media, add your brief, and generate your first draft. <Link className="underline" href="/shopreel/create">Create project</Link></div> :
        <div className="grid gap-2">{recent.map((item) => <Link key={item.id} href={`/shopreel/generations/${item.id}`} className="rounded-xl border border-white/10 p-3 text-sm hover:bg-white/[0.04]">Project {item.id.slice(0, 8)} · {item.status}</Link>)}</div>}
      </GlassCard>
    </GlassShell>
  );
}
