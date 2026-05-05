import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

const PROMPT_CHIPS = ["Product launch reel", "Founder video", "Social media campaign", "Blog post", "How-to video"];
const IDEAS = ["Q2 launch narrative with founder-led hooks", "Before/after transformation carousel with short captions", "Repurpose one product demo into a week of channel content"];
const READINESS = ["Upload at least one source video", "Define your preferred tone in prompt", "Connect channels before publishing"];

const START_TEMPLATES = [
  { title: "Short-form video", description: "Reels, TikToks, and Shorts with hook-first pacing.", icon: "▶", tone: "from-violet-500/40 to-blue-400/20" },
  { title: "Social post", description: "Visual + caption concepts tuned for conversions.", icon: "✦", tone: "from-fuchsia-500/40 to-rose-400/20" },
  { title: "Blog post", description: "Long-form narratives from raw clips and ideas.", icon: "✎", tone: "from-emerald-500/30 to-cyan-400/20" },
  { title: "Repurpose content", description: "Turn one upload into cross-channel assets.", icon: "↻", tone: "from-amber-500/35 to-orange-400/20" },
  { title: "Campaign bundle", description: "Generate a campaign set from one brief.", icon: "◈", tone: "from-sky-500/40 to-indigo-400/20" },
  { title: "Product promo", description: "Benefit-led promo sequences with clear CTA.", icon: "⚑", tone: "from-purple-500/40 to-cyan-300/20" },
  { title: "Influencer content", description: "Creator-native scripts and cut directions.", icon: "☼", tone: "from-pink-500/35 to-violet-400/20" },
];

const PIPELINE_STEPS: Array<{ label: string; key: "drafts" | "review" | "processing" | "ready" | "published"; hint: string }> = [
  { label: "Drafts", key: "drafts", hint: "Ideas forming" },
  { label: "In Review", key: "review", hint: "Awaiting edits" },
  { label: "Processing", key: "processing", hint: "Rendering now" },
  { label: "Ready", key: "ready", hint: "Prepared output" },
  { label: "Published", key: "published", hint: "Live channels" },
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
    <GlassShell
      eyebrow="Home"
      title="Your AI content engine"
      subtitle="Upload media, describe the outcome, and generate videos, posts, blogs, captions, and campaigns — all in one place."
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/70">⌘K Search ideas, projects, and templates</div>
          <div className="flex items-center gap-2 text-white/70">
            <button type="button" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">⚡ Quick create</button>
            <button type="button" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm">🔔</button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <section className="relative overflow-hidden rounded-[30px] border border-violet-300/30 bg-[radial-gradient(circle_at_15%_0%,rgba(127,92,255,0.4),transparent_44%),radial-gradient(circle_at_92%_0%,rgba(66,198,255,0.25),transparent_40%),linear-gradient(145deg,rgba(7,10,25,0.98),rgba(5,8,20,0.88))] p-5 shadow-[0_40px_130px_rgba(12,10,35,0.55)] md:p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-semibold text-white md:text-4xl">Your AI content engine</h2>
                <p className="mt-2 max-w-3xl text-sm text-white/75">Upload media, describe the outcome, and generate videos, posts, blogs, captions, and campaigns — all in one place.</p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-black/30 p-3.5 backdrop-blur-2xl md:p-4">
                <div className="rounded-2xl border border-violet-300/25 bg-slate-950/80 px-4 py-4 text-sm text-white/70">Describe what you want. Example: Create a 30-second product launch reel for Instagram with upbeat pacing, captions, social cutdowns, and one clear CTA.</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/shopreel/upload" className="rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/[0.14]">Upload media</Link>
                  <Link href="/shopreel/create?template=Enhance%20my%20draft" className="rounded-xl border border-white/15 bg-black/35 px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/[0.08]">Enhance</Link>
                  <Link href="/shopreel/create" className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(108,85,255,0.45)]">Create new content</Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {PROMPT_CHIPS.map((chip) => (
                  <Link key={chip} href={`/shopreel/create?template=${encodeURIComponent(chip)}`} className="rounded-full border border-white/15 bg-gradient-to-r from-white/[0.12] to-white/[0.04] px-4 py-2 text-xs font-medium text-white/85 transition hover:-translate-y-0.5 hover:bg-white/[0.15]">
                    {chip}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-white/60">Your content pipeline</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {PIPELINE_STEPS.map((step) => (
                <div key={step.key} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
                  <div className="text-xs text-white/55">{step.label}</div>
                  <div className="mt-0.5 text-lg font-semibold text-white">{pipelineValues[step.key]}</div>
                  <div className="text-[11px] text-white/45">{step.hint}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 text-lg font-semibold text-white">Start creating</div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {START_TEMPLATES.map((template) => (
                <Link key={template.title} href={`/shopreel/create?template=${encodeURIComponent(template.title)}`} className="group rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 shadow-[0_18px_50px_rgba(7,10,24,0.35)] transition hover:-translate-y-1 hover:bg-white/[0.08]">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-gradient-to-br ${template.tone} text-base text-white`}>{template.icon}</div>
                  <div className="mt-2 text-sm font-semibold text-white">{template.title}</div>
                  <div className="mt-1 text-xs leading-5 text-white/65">{template.description}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-base font-semibold text-white">Recent projects</div>
            {recent.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-lg font-semibold text-white">Your first project starts here.</div>
                <div className="mt-1.5 text-sm text-white/70">Upload media or start with an idea and ShopReel will generate your first draft.</div>
                <div className="mt-3"><Link href="/shopreel/create" className="rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white">Create content</Link></div>
              </div>
            ) : (
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {recent.map((item) => (
                  <Link key={item.id} href={`/shopreel/generations/${item.id}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/85 hover:bg-white/[0.06]">
                    <div className="font-medium">Project {item.id.slice(0, 8)}</div>
                    <div className="mt-1 text-xs text-white/60">Status: {item.status}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>

        <aside className="hidden space-y-3 xl:block">
          <div className="rounded-2xl border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-3.5">
            <div className="text-xs tracking-[0.18em] text-cyan-100/75">FEATURED PREVIEW</div>
            <div className="mt-2 text-lg font-semibold text-white">What you can create</div>
            <div className="mt-2.5 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/75">Launch reels, platform-ready posts, product explainers, campaign packs, and blog drafts from a single brief.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="text-sm font-semibold text-white">AI content ideas</div>
            <div className="mt-3 space-y-2.5">{IDEAS.map((idea) => <div key={idea} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80">{idea}</div>)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="text-sm font-semibold text-white">Brand voice summary</div>
            <p className="mt-2 text-sm text-white/70">Keep tone clear, confident, and customer-focused. Lead with outcomes, keep hooks concise, and anchor every output to one CTA.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white">Brand voice setup</div>
              <Link href="/settings" className="text-xs font-medium text-cyan-200 hover:text-cyan-100">Settings</Link>
            </div>
            <div className="mt-2 text-sm text-white/70">Keep tone clear, confident, and customer-focused. Lead with outcomes, concise hooks, and one CTA per output.</div>
            <div className="mt-2.5 space-y-2">{READINESS.map((item) => <div key={item} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/75">{item}</div>)}</div>
          </div>
        </aside>
      </div>
    </GlassShell>
  );
}
