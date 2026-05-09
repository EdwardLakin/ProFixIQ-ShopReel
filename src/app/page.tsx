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
  state: string;
};

const capabilityPanels: Capability[] = [
  { title: "Operational memory", body: "The system remembers brand voice, audience patterns, campaign learnings, and repeatable content formulas.", accent: "cyan" },
  { title: "Production orchestration", body: "Generation, review, rendering, export packages, and publishing prep stay connected instead of scattered across tools.", accent: "violet" },
  { title: "Human-controlled AI", body: "AI can suggest, assemble, and prepare work, but operators keep approval control before anything leaves the system.", accent: "emerald" },
  { title: "Performance feedback loop", body: "Campaign results become reusable intelligence for future hooks, angles, formats, and channels.", accent: "copper" },
];

const pipelineSteps: Pipeline[] = [
  { step: "01", label: "Business signals", state: "Input live" },
  { step: "02", label: "AI detection", state: "Context mapped" },
  { step: "03", label: "Campaign planning", state: "Drafting" },
  { step: "04", label: "Asset generation", state: "Rendering" },
  { step: "05", label: "Review layer", state: "Operator gated" },
  { step: "06", label: "Render queue", state: "Pressure nominal" },
  { step: "07", label: "Publish package", state: "Staged" },
  { step: "08", label: "Performance learning", state: "Ingesting" },
  { step: "09", label: "Campaign memory", state: "Synchronized" },
];

const memoryItems = ["Brand voice", "Winning hooks", "Campaign structures", "Audience behavior", "Publishing cadence", "Performance learnings", "Review preferences", "Production workflows"];
const audienceChips = ["Solo creators", "Small businesses", "SaaS teams", "Agencies", "Local service brands", "Franchise/location teams", "Internal marketing teams", "Founder-led brands"];

function StatusDot({ tone }: { tone: "emerald" | "cyan" | "violet" }) {
  const toneClass = tone === "emerald" ? "bg-emerald-300" : tone === "cyan" ? "bg-cyan-300" : "bg-violet-300";
  return <span className={`inline-block h-2 w-2 rounded-full ${toneClass}`} />;
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-black/35 px-2.5 py-2"><p className="text-[10px] uppercase tracking-[0.16em] text-white/48">{label}</p><p className="mt-1 text-xs font-medium text-white">{value}</p></div>;
}

function CapabilityPanel({ title, body, accent }: Capability) {
  const accentClass = accent === "cyan" ? "text-cyan-300" : accent === "violet" ? "text-violet-300" : accent === "emerald" ? "text-emerald-300" : "text-amber-300";
  return <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><p className={`text-xs uppercase tracking-[0.22em] ${accentClass}`}>Capability</p><h3 className="mt-3 text-xl font-semibold text-white">{title}</h3><p className="mt-3 text-sm leading-7 text-white/70">{body}</p></article>;
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040714] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(34,211,238,0.13),transparent_34%),radial-gradient(circle_at_90%_14%,rgba(124,58,237,0.16),transparent_36%),linear-gradient(180deg,#060b19_0%,#030712_58%,#01030a_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_12%,rgba(34,211,238,0.07)_50%,transparent_88%),linear-gradient(180deg,transparent_10%,rgba(124,58,237,0.06)_58%,transparent_96%)]" />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-14 pt-9 md:pt-12">
        <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-500/[0.08] px-4 py-2.5 text-[11px] uppercase tracking-[0.24em] text-cyan-100/88">
          <div className="flex flex-wrap gap-x-4 gap-y-1"><span>SYSTEM ONLINE</span><span>12 renders active</span><span>Campaign memory synchronized</span><span>4 approvals pending</span><span>Publishing queue stable</span></div>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2.5"><span className="rounded-full border border-white/12 bg-white/[0.06] px-4 py-1.5 text-sm text-white/80">AI content operating system</span><span className="text-[11px] uppercase tracking-[0.22em] text-white/45">by ProFixIQ</span></div>
            <h1 className="text-3xl font-semibold leading-[1.05] sm:text-4xl lg:text-5xl 2xl:text-6xl">ShopReel is the AI operating system for modern content teams.<span className="mt-1 block bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">Plan campaigns. Generate assets. Review outputs. Publish with control.</span></h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base md:text-lg md:leading-8">ShopReel turns ideas, media, business activity, and performance feedback into a continuous content system — from campaign planning to video generation, publishing packages, analytics, and AI learning loops.</p>
            <div className="mt-6 flex flex-wrap gap-3"><Link href="/signup" className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:scale-[1.02]">Start building your content OS</Link><Link href="/login" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10">Sign in</Link></div>
          </div>

          <div className="relative">
            <div className="rounded-[1.65rem] border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl shadow-black/40 backdrop-blur-xl md:p-4">
              <div className="rounded-[1.25rem] border border-white/10 bg-[#091022]/95 p-3.5 md:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-white/45">AI operating console</p><p className="text-lg font-semibold">Production stable</p></div><div className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-200"><StatusDot tone="emerald" /> <span className="ml-1">Operator-controlled</span></div></div>
                <div className="mt-3 rounded-xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/10 to-violet-400/10 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-white/55">Active campaign</p><p className="mt-1 text-xl font-semibold text-white">Q3 Growth Push</p><p className="text-sm text-cyan-100/85">12 assets in production · continuity retained</p></div>
                <div className="mt-2.5 grid gap-2 sm:grid-cols-3"><MetricTile label="Renders" value="4 active" /><MetricTile label="Queue pressure" value="Nominal" /><MetricTile label="Review throughput" value="3 approvals" /></div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-2.5"><p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">Pipeline stack</p><div className="mt-2 space-y-1.5">{["Source intelligence","Campaign planning","Scene generation","Review control","Render/export","Publishing prep","Performance learning"].map((item, i) => (<div key={item} className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5"><span className="text-[10px] text-white/40">{String(i + 1).padStart(2, "0")}</span><div className="h-px flex-1 bg-gradient-to-r from-cyan-200/45 to-transparent" /><span className="text-xs text-white/82">{item}</span></div>))}</div></div>
                <div className="mt-3 grid gap-1.5 text-[11px] text-white/70 sm:grid-cols-2"><div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">Render readiness nominal</div><div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">Campaign continuity retained</div><div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">Memory synchronized</div><div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">Queue stable</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none my-8 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />

        <section className="relative rounded-[1.8rem] border border-white/10 bg-white/[0.028] p-6 md:p-7">
          <h2 className="text-3xl font-semibold md:text-4xl">Not another editor. A content operating layer.</h2><p className="mt-4 max-w-4xl text-white/70">Most tools give you a blank editor. ShopReel gives you the operating layer around creation: brand memory, campaign planning, AI generation, review workflows, render/export queues, publishing control, and feedback loops that improve the next campaign.</p><div className="mt-6 grid gap-4 md:grid-cols-2">{capabilityPanels.map((capability) => <CapabilityPanel key={capability.title} {...capability} />)}</div>
        </section>

        <section className="relative mt-9 overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/28 p-6 md:p-7">
          <div className="absolute inset-x-6 top-12 h-px bg-gradient-to-r from-cyan-300/25 via-violet-300/25 to-transparent" />
          <h2 className="text-3xl font-semibold md:text-4xl">Persistent AI memory, not disposable prompts.</h2>
          <p className="mt-4 max-w-4xl text-white/70">Most AI tools reset every session. ShopReel is designed around durable operating memory: brand rules, campaign learnings, audience behavior, publishing cadence, and performance patterns.</p>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><article className="rounded-2xl border border-cyan-300/15 bg-white/[0.02] p-4"><p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Memory architecture ledger</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{memoryItems.map((item) => <div key={item} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">{item}</div>)}</div></article><article className="rounded-2xl border border-violet-300/20 bg-violet-400/5 p-4"><p className="text-xs uppercase tracking-[0.2em] text-violet-200/80">Sync rail</p><div className="mt-3 space-y-2">{["Brand brain synchronized","Campaign memory graph attached","Learning loop indexed","Operator approvals retained"].map((status, idx) => <div key={status} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/82"><StatusDot tone={idx % 2 === 0 ? "emerald" : "violet"} />{status}</div>)}</div></article></div>
        </section>

        <section className="relative mt-9 rounded-[1.8rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-500/8 via-white/[0.03] to-violet-500/8 p-6 md:p-7">
          <h2 className="text-3xl font-semibold md:text-4xl">What the AI operating system actually runs.</h2>
          <div className="mt-5 text-xs uppercase tracking-[0.2em] text-cyan-100/80">Production map · generation stability · continuity path</div>
          <div className="mt-6 hidden gap-2 lg:grid lg:grid-cols-9">{pipelineSteps.map((item, index) => <div key={item.step} className="relative rounded-xl border border-white/10 bg-black/30 p-3"><p className="text-xs text-cyan-200/80">{item.step}</p><p className="mt-1 text-sm font-medium text-white">{item.label}</p><p className="mt-1 text-[11px] text-white/55">{item.state}</p><span className="absolute -top-1 left-3 h-2 w-2 rounded-full bg-cyan-300/80" />{index < pipelineSteps.length - 1 ? <div className="absolute -right-1 top-1/2 h-px w-2 bg-cyan-200/60" /> : null}</div>)}</div>
          <div className="mt-6 space-y-2 lg:hidden">{pipelineSteps.map((item, index) => <div key={item.step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3"><span className="text-xs text-cyan-200/80">{item.step}</span><span className="h-2 w-2 rounded-full bg-cyan-300/80" /><span className="text-sm text-white/85">{item.label}</span>{index < pipelineSteps.length - 1 ? <span className="ml-auto h-px w-6 bg-cyan-200/40" /> : null}</div>)}</div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><article className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-6"><p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Campaign command</p><h3 className="mt-3 text-3xl font-semibold">One signal can become a full campaign system.</h3><p className="mt-4 text-white/70">A product launch, service offer, customer result, educational theme, or raw business insight can become coordinated hooks, scripts, videos, captions, thumbnails, publishing packages, and follow-up variants.</p></article><article className="rounded-[1.6rem] border border-white/10 bg-black/25 p-6"><p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Learning loop</p><h3 className="mt-3 text-3xl font-semibold">Every output teaches the next one.</h3><p className="mt-4 text-white/70">ShopReel is designed to capture what performs, save winning patterns, and feed those learnings back into future campaigns so the system compounds over time.</p></article></section>

        <section className="mt-10 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6"><h2 className="text-2xl font-semibold md:text-3xl">Built for operators, creators, and teams who need consistent output.</h2><div className="mt-5 flex flex-wrap gap-2.5">{audienceChips.map((chip) => <div key={chip} className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-sm text-white/80">{chip}</div>)}</div></section>

        <section className="mt-12 rounded-[1.8rem] border border-white/12 bg-[linear-gradient(140deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-7 text-center"><h2 className="text-3xl font-semibold md:text-4xl">Build the system that keeps creating after the first post.</h2><p className="mx-auto mt-4 max-w-3xl text-white/72">Start with a prompt, a campaign, or real business activity. ShopReel turns it into a controlled content operation with memory, production visibility, and feedback loops.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/signup" className="rounded-2xl bg-white px-6 py-3 font-medium text-black">Start building your content OS</Link><Link href="/login" className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white">Sign in</Link></div></section>
      </section>

      <div className="relative border-t border-white/10"><PricingSection /></div>
    </main>
  );
}
