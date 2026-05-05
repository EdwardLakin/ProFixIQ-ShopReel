import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

const PROMPT_CHIPS = ["Product launch reel", "Founder video", "Social media campaign", "Blog post", "How-to video"];
const IDEAS = ["Q2 product launch campaign content ideas", "Behind-the-scenes creator series for Instagram", "Email newsletter: welcome sequence for new subscribers"];

const START_TEMPLATES = [
  { title: "Short-form video", description: "Reels, TikToks, and Shorts designed to stop the scroll.", icon: "▶", tone: "from-violet-500/30 to-blue-400/15" },
  { title: "Social post", description: "Polished captions, hooks, and CTA-first visuals.", icon: "✦", tone: "from-fuchsia-500/30 to-rose-400/15" },
  { title: "Blog post", description: "SEO-ready articles from notes, clips, or interviews.", icon: "✎", tone: "from-emerald-500/25 to-cyan-400/10" },
  { title: "Repurpose content", description: "Turn one asset into a full distribution pack.", icon: "↻", tone: "from-amber-500/25 to-orange-400/10" },
  { title: "Campaign bundle", description: "Build cross-channel assets with one brief.", icon: "◈", tone: "from-sky-500/30 to-indigo-400/15" },
  { title: "Influencer content", description: "Creator-native concepts with brand-safe voice.", icon: "⚑", tone: "from-purple-500/30 to-cyan-300/15" },
];

const PIPELINE_STEPS: Array<{ label: string; key: "drafts" | "review" | "processing" | "ready" | "published"; hint: string }> = [
  { label: "Drafts", key: "drafts", hint: "Idea to first output" },
  { label: "In review", key: "review", hint: "Awaiting final edits" },
  { label: "Processing", key: "processing", hint: "Rendering in queue" },
  { label: "Ready", key: "ready", hint: "Prepared for export" },
  { label: "Published", key: "published", hint: "Connected channels" },
];

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();

  const [{ count: drafts = 0 }, { count: review = 0 }, { count: rendering = 0 }, { count: ready = 0 }, { data: recentData }] = await Promise.all([
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).in("status", ["draft", "queued"]),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "review"),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "rendering"),
    supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "ready"),
    supabase.from("shopreel_story_generations").select("id, status, created_at").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(6),
  ]);

  const recent = recentData ?? [];
  const pipelineValues = { drafts, review, processing: rendering, ready, published: 0 };

  return (
    <GlassShell eyebrow="Welcome back" title="Your AI content engine" subtitle="Create videos, posts, blogs, launch assets, and campaigns from one premium studio flow.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="relative overflow-hidden rounded-[30px] border border-violet-300/25 bg-[radial-gradient(circle_at_18%_0%,rgba(133,89,255,0.35),transparent_42%),radial-gradient(circle_at_92%_0%,rgba(66,198,255,0.22),transparent_40%),linear-gradient(140deg,rgba(7,11,28,0.96),rgba(7,10,25,0.86))] p-6 shadow-[0_30px_100px_rgba(13,11,38,0.55)] md:p-8">
          <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -right-10 top-4 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative space-y-6">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/65">Creator-grade studio</div>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white md:text-5xl">Plan less. Create faster. Ship content that performs.</h2>
              <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-base">Upload source media, write one clear brief, and turn it into channel-ready drafts for creators, agencies, and in-house brand teams.</p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-xl md:p-5">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 text-sm text-white/70">Describe what you want to create... Example: Create a 30-second product launch reel for Instagram with upbeat music, captions, and one clear CTA.</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/shopreel/upload"><GlassButton variant="secondary">Upload media</GlassButton></Link>
                <Link href="/shopreel/create?template=Enhance%20my%20draft"><GlassButton variant="ghost">Enhance</GlassButton></Link>
                <Link href="/shopreel/create"><GlassButton variant="primary">Create new content</GlassButton></Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PROMPT_CHIPS.map((chip) => (
                <Link key={chip} href={`/shopreel/create?template=${encodeURIComponent(chip)}`} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/[0.1]">{chip}</Link>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <GlassCard title="AI content ideas" description="Prompt starters you can convert into drafts immediately.">
            <div className="space-y-2.5">
              {IDEAS.map((idea) => <div key={idea} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80">{idea}</div>)}
            </div>
          </GlassCard>
        </aside>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <div className="mb-3 text-sm text-white/75">Your content pipeline</div>
        <div className="grid gap-2 md:grid-cols-5">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.key} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
              <div className="text-xs text-white/55">{step.label}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{pipelineValues[step.key]}</div>
              <div className="mt-1 text-xs text-white/45">{step.hint}</div>
            </div>
          ))}
        </div>
      </section>

      <GlassCard title="Start creating" description="Choose a creation track and move straight into the guided studio.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {START_TEMPLATES.map((template) => (
            <Link key={template.title} href={`/shopreel/create?template=${encodeURIComponent(template.title)}`} className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.08]">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br ${template.tone} text-lg text-white`}>{template.icon}</div>
              <div className="mt-3 text-sm font-semibold text-white">{template.title}</div>
              <div className="mt-1 text-sm text-white/65">{template.description}</div>
            </Link>
          ))}
        </div>
      </GlassCard>

      <GlassCard title="Recent projects" description="Continue what you started and move projects to ready-to-publish.">
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="text-lg font-semibold text-white">No projects yet.</div>
            <div className="mt-2 text-sm text-white/70">Start with a media upload and one clear brief to generate your first draft.</div>
            <div className="mt-4"><Link href="/shopreel/create"><GlassButton variant="primary">Create content</GlassButton></Link></div>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((item) => (
              <Link key={item.id} href={`/shopreel/generations/${item.id}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/85 hover:bg-white/[0.06]">
                <div className="font-medium">Project {item.id.slice(0, 8)}</div>
                <div className="mt-1 text-xs text-white/60">Status: {item.status}</div>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
