import Link from "next/link";
import PricingSection from "@/features/landing/components/PricingSection";

const featureCards = [
  {
    title: "Turn real business activity into content",
    body:
      "Transform photos, videos, jobs, inspections, team activity, customer moments, and real-world work into content opportunities automatically.",
  },
  {
    title: "Generate campaigns, not just posts",
    body:
      "Start with one idea, one offer, or one story and let ShopReel split it into multiple angles, hooks, videos, captions, and platform-ready assets.",
  },
  {
    title: "Run the full marketing loop",
    body:
      "Create, review, publish, track performance, learn what works, and feed winning angles back into future campaigns from one system.",
  },
];

const audienceCards = [
  "Automotive and truck repair",
  "Home services",
  "Beauty and wellness",
  "Real estate and property",
  "Medical and dental",
  "Local retail and hospitality",
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
  "Business activity",
  "AI story + campaign creation",
  "Content published",
  "Performance analytics",
  "AI learns what works",
  "Better future campaigns",
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
                AI content automation for modern businesses
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                by ProFixIQ
              </div>
            </div>

            <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] md:text-7xl">
              Your business is already creating the story.
              <span className="block bg-gradient-to-r from-[#ffffff] via-[#b6c4ff] to-[#7dd3fc] bg-clip-text text-transparent">
                ShopReel turns it into campaigns, content, and growth.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70 md:text-xl">
              ShopReel is the AI content engine built to convert real work into
              publish-ready marketing. Generate videos, posts, campaigns, and
              platform-ready assets from everyday business activity, then track
              what works and improve automatically over time.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:scale-[1.02]"
              >
                Start free
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
                    <div className="text-sm text-white/50">Autonomous content engine</div>
                    <div className="text-xl font-semibold text-white">
                      One workflow. Multiple outputs. Better every cycle.
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
              More than a social media tool.
            </h2>
            <p className="mt-4 text-white/70">
              ShopReel is built for businesses that already create value every
              day and want a system that can turn that activity into consistent,
              scalable marketing. It is a campaign generator, content engine,
              and learning loop in one workflow.
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

          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {loopSteps.map((step, index) => (
              <div
                key={step}
                className="relative rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Step {index + 1}
                </div>
                <div className="mt-2 text-sm font-medium text-white/85">
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative">
        <PricingSection />
      </div>
    </main>
  );
}