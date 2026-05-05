import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

const PROMPT_CHIPS = ["Product launch reel", "Founder video", "Social media campaign", "Blog post", "How-to video"];

const START_TEMPLATES = [
  { title: "Short-form video", description: "Create platform-ready reels, shorts, and stories from raw footage.", icon: "▶" },
  { title: "Social post", description: "Generate scroll-stopping posts with hooks, captions, and CTA variants.", icon: "✦" },
  { title: "Blog post", description: "Turn interviews, notes, or recordings into editorial drafts instantly.", icon: "✎" },
  { title: "Repurpose content", description: "Convert one long asset into many pieces for every channel.", icon: "↻" },
  { title: "Campaign bundle", description: "Build a coordinated launch kit with consistent message and tone.", icon: "◈" },
  { title: "Product promo", description: "Highlight product value with creator-native scripting and structure.", icon: "⬢" },
  { title: "Influencer content", description: "Shape sponsored and organic creator concepts with brand-safe voice.", icon: "⚑" },
];

const PIPELINE_STEPS: Array<{ label: string; key: "drafts" | "review" | "processing" | "ready" | "published" }> = [
  { label: "Drafts", key: "drafts" },
  { label: "In review", key: "review" },
  { label: "Processing", key: "processing" },
  { label: "Ready", key: "ready" },
  { label: "Published", key: "published" },
];

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();

  const [{ count: drafts = 0 }, { count: review = 0 }, { count: rendering = 0 }, { count: ready = 0 }, { data: recentData }] =
    await Promise.all([
      supabase
        .from("shopreel_story_generations")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .in("status", ["draft", "queued"]),
      supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "review"),
      supabase
        .from("shopreel_story_generations")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("status", "rendering"),
      supabase.from("shopreel_story_generations").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "ready"),
      supabase.from("shopreel_story_generations").select("id, status, created_at").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(5),
    ]);

  const recent = recentData ?? [];
  const pipelineValues = { drafts, review, processing: rendering, ready, published: 0 };

  return (
    <GlassShell
      eyebrow="Home"
      title="Your AI content engine"
      subtitle="Upload media, describe the outcome, and generate videos, posts, blogs, captions, and campaigns — all in one place."
    >
      <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-violet-500/20 via-slate-950/80 to-cyan-500/15 p-6 md:p-8">
        <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative space-y-5">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Create content from anything</h2>
            <p className="mt-3 max-w-3xl text-sm text-white/75 md:text-base">
              Describe what you want to ship, attach source media, and let ShopReel generate first drafts for creators, brands, agencies, and teams.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(8,10,22,0.45)] backdrop-blur-xl md:p-5">
            <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-white/65">
              <div className="text-white/45">Describe what you want to create…</div>
              <div className="mt-2 text-white/80">
                Create a 30-second product launch reel for Instagram with upbeat music and captions.
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/shopreel/upload">
                <GlassButton variant="secondary">Upload media</GlassButton>
              </Link>
              <Link href="/shopreel/create?template=Enhance%20my%20draft">
                <GlassButton variant="ghost">Enhance</GlassButton>
              </Link>
              <Link href="/shopreel/create">
                <GlassButton variant="primary">Create new content</GlassButton>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {PROMPT_CHIPS.map((chip) => (
              <Link key={chip} href={`/shopreel/create?template=${encodeURIComponent(chip)}`} className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.08]">
                {chip}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <div className="grid gap-2 md:grid-cols-5">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.key} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="text-xs text-white/65">{step.label}</div>
              <div className="mt-1 text-2xl font-semibold text-white">{pipelineValues[step.key]}</div>
            </div>
          ))}
        </div>
      </section>

      <GlassCard title="Start creating" description="Use structured templates to get your first high-quality draft in minutes.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {START_TEMPLATES.map((template) => (
            <Link
              key={template.title}
              href={`/shopreel/create?template=${encodeURIComponent(template.title)}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.07]"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/[0.06] text-lg text-white/90">{template.icon}</div>
              <div className="mt-3 text-sm font-semibold text-white">{template.title}</div>
              <div className="mt-1 text-sm text-white/65">{template.description}</div>
            </Link>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <GlassCard title="Recent projects" description="Continue your latest generations and move them to ready-to-publish.">
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-lg font-semibold text-white">Your first project starts here.</div>
              <div className="mt-2 text-sm text-white/70">Upload media or start with an idea and ShopReel will build the first draft.</div>
              <div className="mt-4">
                <Link href="/shopreel/create">
                  <GlassButton variant="primary">Create content</GlassButton>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {recent.map((item) => (
                <Link key={item.id} href={`/shopreel/generations/${item.id}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/85 hover:bg-white/[0.06]">
                  Project {item.id.slice(0, 8)} · {item.status}
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard title="What you can create" description="Use these guidance tracks to keep outputs sharp and brand-consistent.">
          <div className="space-y-3 text-sm text-white/75">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="font-medium text-white">AI content ideas</div>
              <div className="mt-1">Turn one founder interview into a 7-day short-form content run.</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="font-medium text-white">Brand voice</div>
              <div className="mt-1">Set audience and tone in Create so every output stays aligned.</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="font-medium text-white">Output workflow</div>
              <div className="mt-1">Draft → Review → Render. Move one project through the pipeline this week.</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </GlassShell>
  );
}
