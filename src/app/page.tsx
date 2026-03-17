import Link from "next/link";
import PricingSection from "@/features/landing/components/PricingSection";

const featureCards = [
  {
    title: "Turn real work into content",
    body:
      "Transform photos, videos, job activity, inspections, and customer-facing moments into content opportunities without building a separate marketing workflow.",
  },
  {
    title: "Draft faster with AI",
    body:
      "Generate hooks, captions, concepts, and publishing-ready content from the work your business is already doing every day.",
  },
  {
    title: "Publish across channels",
    body:
      "Manage social, blogs, email, business profile content, and more from one content pipeline instead of juggling disconnected tools.",
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

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(34,197,94,0.14),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.03))]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur">
              AI content automation for businesses that already create value every day
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl">
              Your business is already creating content.
              <span className="block bg-gradient-to-r from-[#ffffff] via-[#b6c4ff] to-[#7dd3fc] bg-clip-text text-transparent">
                ShopReel turns it into growth.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">
              Convert everyday work, photos, videos, customer moments, and team activity into
              publish-ready social posts, blogs, email content, and local marketing assets from
              one clean workflow.
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
                Social posts
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Blogs
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Email campaigns
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                Google Business content
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1022]/90 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white/50">Content engine</div>
                    <div className="text-xl font-semibold text-white">
                      One workflow. Multiple channels.
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                    Live pipeline
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Input", "Photos, videos, jobs, notes, inspections, team activity"],
                    ["AI", "Drafts hooks, captions, concepts, sequences, and variants"],
                    ["Review", "Approve, queue, schedule, or auto-publish"],
                    [
                      "Output",
                      "Instagram, Facebook, TikTok, YouTube, blog, email, Google Business",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                        {label}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-white/80">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-sm text-white/55">Content ready</div>
                    <div className="mt-1 text-2xl font-semibold text-white">24</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-sm text-white/55">Channels</div>
                    <div className="mt-1 text-2xl font-semibold text-white">8</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-sm text-white/55">Time saved</div>
                    <div className="mt-1 text-2xl font-semibold text-white">Hours</div>
                  </div>
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
          <div className="max-w-2xl">
            <div className="text-sm uppercase tracking-[0.25em] text-violet-300/80">
              Built for modern operators
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              Not just for repair shops.
            </h2>
            <p className="mt-4 text-white/70">
              ShopReel can support any business that creates real work, visual proof, customer
              results, team moments, or educational value and wants to turn that into a consistent
              marketing engine.
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
      </section>

      <div className="relative">
        <PricingSection />
      </div>
    </main>
  );
}