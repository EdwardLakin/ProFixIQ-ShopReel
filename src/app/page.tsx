import Link from "next/link";
import PricingSection from "@/features/landing/components/PricingSection";

type Capability = {
  title: string;
  body: string;
  accent: "cyan" | "violet" | "emerald" | "copper";
};

type Pipeline = {
  step: string;
  label: string;
};

const capabilityPanels: Capability[] = [
  {
    title: "Operational memory",
    body: "The system remembers brand voice, audience patterns, campaign learnings, and repeatable content formulas.",
    accent: "cyan",
  },
  {
    title: "Production orchestration",
    body: "Generation, review, rendering, export packages, and publishing prep stay connected instead of scattered across tools.",
    accent: "violet",
  },
  {
    title: "Human-controlled AI",
    body: "AI can suggest, assemble, and prepare work, but operators keep approval control before anything leaves the system.",
    accent: "emerald",
  },
  {
    title: "Performance feedback loop",
    body: "Campaign results become reusable intelligence for future hooks, angles, formats, and channels.",
    accent: "copper",
  },
];

const pipelineSteps: Pipeline[] = [
  { step: "01", label: "Business signals" },
  { step: "02", label: "AI detection" },
  { step: "03", label: "Campaign planning" },
  { step: "04", label: "Asset generation" },
  { step: "05", label: "Review layer" },
  { step: "06", label: "Render queue" },
  { step: "07", label: "Publish package" },
  { step: "08", label: "Performance learning" },
  { step: "09", label: "Campaign memory" },
];

const audienceChips = [
  "Solo creators",
  "Small businesses",
  "SaaS teams",
  "Agencies",
  "Local service brands",
  "Franchise/location teams",
  "Internal marketing teams",
  "Founder-led brands",
];

function StatusDot({ tone }: { tone: "emerald" | "cyan" | "violet" }) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-300"
      : tone === "cyan"
        ? "bg-cyan-300"
        : "bg-violet-300";

  return <span className={`inline-block h-2 w-2 rounded-full ${toneClass}`} />;
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/48">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function CapabilityPanel({ title, body, accent }: Capability) {
  const accentClass =
    accent === "cyan"
      ? "text-cyan-300"
      : accent === "violet"
        ? "text-violet-300"
        : accent === "emerald"
          ? "text-emerald-300"
          : "text-amber-300";

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className={`text-xs uppercase tracking-[0.22em] ${accentClass}`}>Capability</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/70">{body}</p>
    </article>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(124,58,237,0.18),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_24%,transparent_82%,rgba(255,255,255,0.02))]" />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-14 md:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr]">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-white/80">AI content operating system</span>
              <span className="text-xs uppercase tracking-[0.22em] text-white/45">by ProFixIQ</span>
            </div>

            <h1 className="text-4xl font-semibold leading-[1.05] md:text-6xl xl:text-7xl">
              ShopReel is the AI operating system for modern content teams.
              <span className="mt-1 block bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">
                Plan campaigns. Generate assets. Review outputs. Publish with control.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-7 text-white/72 md:text-lg md:leading-8">
              ShopReel turns ideas, media, business activity, and performance feedback into a continuous content system — from campaign planning to video generation, publishing packages, analytics, and AI learning loops.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:scale-[1.02]">
                Start building your content OS
              </Link>
              <Link href="/login" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10">
                Sign in
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm text-white/65">
              {["Campaign brain", "Brand memory", "Render queue", "Publishing control", "Learning loop"].map((pill) => (
                <span key={pill} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-black/35 backdrop-blur-xl md:p-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0a1020]/95 p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/55">AI operating console</p>
                  <p className="text-xl font-semibold">System online</p>
                </div>
                <div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  <StatusDot tone="emerald" /> <span className="ml-1">Operational</span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">Active campaign</p>
                <p className="mt-1 text-lg font-semibold">Q3 Growth Push</p>
                <p className="text-sm text-white/65">12 assets in production</p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MetricTile label="Renders" value="4 active renders" />
                <MetricTile label="Queue" value="7 queued outputs" />
                <MetricTile label="Review" value="3 approval items" />
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-200/80">Pipeline stack</p>
                <div className="mt-3 space-y-2">
                  {["Source intelligence", "Campaign planning", "Scene generation", "Review control", "Render/export", "Publishing prep", "Performance learning"].map((item, i) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                      <span className="text-xs text-white/40">{String(i + 1).padStart(2, "0")}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                      <span className="text-sm text-white/82">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-violet-200/80">Live activity feed</p>
                <div className="mt-2 space-y-2 text-sm text-white/78">
                  {[
                    "Brand brain applied: tone guardrails",
                    "Scene package prepared for review",
                    "Winning hook pattern saved",
                    "Publish package ready",
                  ].map((activity, idx) => (
                    <div key={activity} className="flex items-center gap-2.5">
                      <StatusDot tone={idx % 2 === 0 ? "cyan" : "violet"} />
                      <span>{activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-center text-xs tracking-[0.14em] text-amber-200">
                AI proposes. Operators approve.
              </div>
            </div>
          </div>
        </div>

        <section className="mt-14 rounded-[1.8rem] border border-white/10 bg-white/[0.035] p-6 md:p-7">
          <h2 className="text-3xl font-semibold md:text-4xl">Not another editor. A content operating layer.</h2>
          <p className="mt-4 max-w-4xl text-white/70">
            Most tools give you a blank editor. ShopReel gives you the operating layer around creation: brand memory, campaign planning, AI generation, review workflows, render/export queues, publishing control, and feedback loops that improve the next campaign.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {capabilityPanels.map((capability) => (
              <CapabilityPanel key={capability.title} {...capability} />
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[1.8rem] border border-white/10 bg-black/20 p-6 md:p-7">
          <h2 className="text-3xl font-semibold md:text-4xl">What the AI operating system actually runs.</h2>
          <div className="mt-6 hidden gap-2 lg:grid lg:grid-cols-9">
            {pipelineSteps.map((item, index) => (
              <div key={item.step} className="relative rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-cyan-200/80">{item.step}</p>
                <p className="mt-1 text-sm font-medium text-white">{item.label}</p>
                {index < pipelineSteps.length - 1 ? <div className="absolute -right-1 top-1/2 hidden h-px w-2 bg-white/30 lg:block" /> : null}
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 lg:hidden">
            {pipelineSteps.map((item) => (
              <div key={item.step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
                <span className="text-xs text-cyan-200/80">{item.step}</span>
                <span className="text-sm text-white/85">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Campaign command</p>
            <h3 className="mt-3 text-3xl font-semibold">One signal can become a full campaign system.</h3>
            <p className="mt-4 text-white/70">A product launch, service offer, customer result, educational theme, or raw business insight can become coordinated hooks, scripts, videos, captions, thumbnails, publishing packages, and follow-up variants.</p>
          </article>
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Learning loop</p>
            <h3 className="mt-3 text-3xl font-semibold">Every output teaches the next one.</h3>
            <p className="mt-4 text-white/70">ShopReel is designed to capture what performs, save winning patterns, and feed those learnings back into future campaigns so the system compounds over time.</p>
          </article>
        </section>

        <section className="mt-12 rounded-[1.8rem] border border-white/10 bg-white/[0.035] p-6">
          <h2 className="text-2xl font-semibold md:text-3xl">Built for operators, creators, and teams who need consistent output.</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {audienceChips.map((chip) => (
              <div key={chip} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">{chip}</div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[1.8rem] border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-7 text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">Build the system that keeps creating after the first post.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-white/72">Start with a prompt, a campaign, or real business activity. ShopReel turns it into a controlled content operation with memory, production visibility, and feedback loops.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-2xl bg-white px-6 py-3 font-medium text-black">Start building your content OS</Link>
            <Link href="/login" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white">Sign in</Link>
          </div>
        </section>
      </section>

      <div className="relative">
        <PricingSection />
      </div>
    </main>
  );
}
