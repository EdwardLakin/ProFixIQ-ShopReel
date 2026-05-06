import Link from "next/link";
import PricingSection from "@/features/landing/components/PricingSection";

const featureCards = [
  {
    title: "Start before the blank page",
    body:
      "Ask ShopReel what to create, get angles and hooks, then send the best idea straight into the creation flow.",
  },
  {
    title: "Create without learning an editor",
    body:
      "Upload media if you have it, or start with only a prompt. ShopReel handles platform copy, captions, structure, and review handoff.",
  },
  {
    title: "Improve with plain language",
    body:
      "Ask for changes like less salesy, more founder-led, shorter for Instagram, or more trust-building for Facebook.",
  },
];

const audienceCards = [
  "Creators and influencers",
  "Small businesses",
  "SaaS founders",
  "Agencies",
  "Local service brands",
  "Connected business workflows",
];

const workflowSteps = [
  {
    label: "Source",
    value:
      "Jobs, inspections, media, notes, customer wins, daily business activity",
  },
  {
    label: "Generate",
    value:
      "AI turns one idea into videos, posts, angles, campaigns, and content variants",
  },
  {
    label: "Publish",
    value:
      "Review, queue, schedule, and publish across your content pipeline",
  },
  {
    label: "Learn",
    value:
      "Track performance, extract winning patterns, and improve future campaigns automatically",
  },
];

const metricsCards = [
  {
    label: "Campaigns",
    value: "One idea → many assets",
  },
  {
    label: "Workflow",
    value: "Create → Publish → Learn",
  },
  {
    label: "Channels",
    value: "Social + blog + email + more",
  },
];

const loopSteps = [
  {
    step: "01",
    title: "Business activity",
    body:
      "Your team is already creating the raw material through jobs, inspections, photos, videos, notes, and customer outcomes.",
  },
  {
    step: "02",
    title: "AI story + campaign creation",
    body:
      "ShopReel turns real activity into story angles, videos, captions, campaigns, and platform-ready assets.",
  },
  {
    step: "03",
    title: "Content published",
    body:
      "Assets move through review, queue, scheduling, and publishing across your content pipeline.",
  },
  {
    step: "04",
    title: "Performance analytics",
    body:
      "The system tracks outputs, engagement, views, and campaign-level performance across connected channels.",
  },
  {
    step: "05",
    title: "AI learns what works",
    body:
      "Winning angles, stronger hooks, and better-performing themes become learnings the system can reuse.",
  },
  {
    step: "06",
    title: "Better future campaigns",
    body:
      "Each cycle improves the next one, creating a marketing engine that gets smarter over time.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.14),transparent_28%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.12),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.03))]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur">
                AI content engine
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                by ProFixIQ
              </div>
            </div>

            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] md:text-7xl">
              Create content without becoming an editor.
              <span className="block bg-gradient-to-r from-[#ffffff] via-[#b6c4ff] to-[#7dd3fc] bg-clip-text text-transparent">
                Ask for ideas. Upload what you have. Approve what it makes.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70 md:text-xl">
              ShopReel turns rough ideas, screenshots, product photos, clips, and daily business moments into platform-ready posts, reels, blogs, and campaigns — without making you learn a complicated editor.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:scale-[1.02]"
              >
                Start creating
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Video campaigns
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Social content
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Blog + email
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Automation loop
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Learns what works
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1022]/90 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-white/50">AI creative operator</div>
                    <div className="text-xl font-semibold text-white">
                      Ask. Create. Review. Post.
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    Live loop
                  </div>
                </div>

                <div className="space-y-3">
                  {workflowSteps.map((step) => (
                    <div
                      key={step.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                        {step.label}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-white/80">
                        {step.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {metricsCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="text-sm text-white/55">{card.label}</div>
                      <div className="mt-1 text-lg font-semibold text-white">
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur"
            >
              <h2 className="text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <div className="max-w-3xl">
            <div className="text-sm uppercase tracking-[0.25em] text-violet-300/80">
              Built for modern operators
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Not another editing suite.
            </h2>
            <p className="mt-4 text-white/70">
              Most tools start with a blank editor. ShopReel starts with a conversation. Tell it what you want, upload what you have, and let AI handle hooks, captions, platform fit, and the messy middle.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {audienceCards.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
              Campaign mode
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              One idea can become an entire campaign.
            </h2>
            <p className="mt-4 text-white/70">
              Start with a product launch, service offer, customer result,
              educational theme, or business insight. ShopReel can break it into
              multiple angles, videos, hooks, captions, and content assets
              designed for platform-ready publishing.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <div className="text-sm uppercase tracking-[0.25em] text-emerald-300/80">
              Learning loop
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              The system gets smarter as it runs.
            </h2>
            <p className="mt-4 text-white/70">
              ShopReel tracks what performs, identifies winning angles, and feeds
              those learnings into future campaigns. The goal is not just to
              create content, but to create a system that compounds results over
              time.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
          <div className="max-w-3xl">
            <div className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
              Compounding growth loop
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Business activity turns into a smarter marketing engine.
            </h2>
            <p className="mt-4 text-white/70">
              ShopReel is designed to turn daily operations into content, content
              into analytics, analytics into learnings, and learnings into even
              stronger future campaigns.
            </p>
          </div>

          <div className="relative mt-10">
            <div className="absolute left-5 right-5 top-6 hidden h-px bg-gradient-to-r from-cyan-400/0 via-cyan-300/40 to-emerald-300/0 xl:block" />

            <div className="grid gap-4 xl:grid-cols-6">
              {loopSteps.map((item, index) => (
                <div
                  key={item.step}
                  className="relative rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                      {item.step}
                    </div>

                    {index < loopSteps.length - 1 ? (
                      <div className="hidden xl:block h-px flex-1 bg-gradient-to-r from-cyan-300/40 to-transparent" />
                    ) : null}
                  </div>

                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/70">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative">
        <PricingSection />
      </div>
    </main>
  );
}