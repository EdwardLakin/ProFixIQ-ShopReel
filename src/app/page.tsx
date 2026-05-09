import Link from "next/link";
import PricingSection from "@/features/landing/components/PricingSection";

type Capability = {
  title: string;
  body: string;
  accent: "cyan" | "violet" | "blue" | "amber";
  link: string;
};

type MetricStripItem = {
  label: string;
  state: string;
  value: string;
  accent: string;
};

const navLinks = ["Platform", "Capabilities", "System", "Pricing", "Resources"];
const statusRail = [
  { label: "SYSTEM ONLINE", tone: "bg-emerald-300" },
  { label: "12 RENDERS ACTIVE", tone: "bg-cyan-300" },
  { label: "CAMPAIGN MEMORY SYNCED", tone: "bg-violet-300" },
  { label: "4 APPROVALS PENDING", tone: "bg-amber-300" },
  { label: "PUBLISHING QUEUE STABLE", tone: "bg-blue-300" },
  { label: "ALL SYSTEMS NOMINAL", tone: "bg-emerald-300" },
];

const capabilities: Capability[] = [
  { title: "Operational memory", body: "Brand, audience, campaign, and performance memory — always on and always learning.", accent: "cyan", link: "Explore memory" },
  { title: "Production orchestration", body: "From generation to final export, every step is orchestrated, tracked, and connected.", accent: "violet", link: "Explore pipeline" },
  { title: "Human-controlled AI", body: "AI can suggest, assemble, and prepare work — but operators approve every move.", accent: "blue", link: "Explore control" },
  { title: "Performance feedback loop", body: "Every output teaches the next one. Results and learnings compound over time.", accent: "amber", link: "Explore learning" },
];

const bottomMetrics: MetricStripItem[] = [
  { label: "Render readiness", state: "Nominal", value: "98%", accent: "text-emerald-300" },
  { label: "Campaign continuity", state: "Retained", value: "96%", accent: "text-cyan-300" },
  { label: "Memory synchronization", state: "Synchronized", value: "100%", accent: "text-violet-300" },
  { label: "Queue stability", state: "Stable", value: "94%", accent: "text-blue-300" },
  { label: "Operator control", state: "Active", value: "100%", accent: "text-emerald-300" },
];

const memoryItems = ["Brand voice", "Winning hooks", "Campaign structures", "Audience behavior", "Publishing cadence", "Performance learnings", "Review preferences", "Production workflows"];
const audienceChips = ["Solo creators", "Small businesses", "SaaS teams", "Agencies", "Local service brands", "Franchise/location teams", "Internal marketing teams", "Founder-led brands"];

const accentMap: Record<Capability["accent"], string> = {
  cyan: "from-cyan-400/35 to-cyan-300/5 text-cyan-200",
  violet: "from-violet-400/35 to-violet-300/5 text-violet-200",
  blue: "from-blue-400/35 to-blue-300/5 text-blue-200",
  amber: "from-amber-400/35 to-amber-300/5 text-amber-200",
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(147,51,234,0.18),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.1),transparent_45%),linear-gradient(180deg,#030712_0%,#040817_38%,#02040e_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:56px_56px]" />

      <section className="relative mx-auto max-w-7xl px-5 pb-12 pt-5 sm:px-6 md:pt-8">
        <header className="rounded-2xl bg-slate-950/55 px-4 py-3 ring-1 ring-white/[0.08] backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-xl font-semibold tracking-tight">ShopReel</Link>
            <nav className="hidden items-center gap-6 text-sm text-white/70 lg:flex">{navLinks.map((link) => <a key={link} href={link === "Pricing" ? "#pricing" : "#"} className="transition hover:text-white">{link}</a>)}</nav>
            <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm ring-1 ring-white/15 hover:bg-white/[0.08]">Sign in</Link><Link href="/signup" className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black sm:px-4">Start building</Link></div>
          </div>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-slate-950/55 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-white/72 ring-1 ring-cyan-300/20">
          {statusRail.map((item) => (
            <div key={item.label} className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${item.tone}`} />{item.label}</div>
          ))}
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_1.02fr]">
          <div>
            <div className="inline-flex rounded-full bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.24em] text-cyan-200 ring-1 ring-white/10">AI content operating system</div>
            <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.02] md:text-6xl">The AI-native content operating <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">system.</span></h1>
            <p className="mt-5 max-w-2xl text-lg leading-9 text-white/72">Plan campaigns. Generate assets. Review outputs. Publish with control. ShopReel turns ideas, media, business activity, and performance feedback into a continuous content engine.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/signup" className="rounded-2xl bg-white px-6 py-3 font-medium text-black">Start building your content OS</Link><Link href="#system" className="rounded-2xl bg-white/[0.03] px-6 py-3 text-white ring-1 ring-white/20">See it in action</Link></div>
          </div>

          <section id="system" className="rounded-[1.8rem] bg-slate-950/60 p-3 ring-1 ring-cyan-300/25 shadow-[0_0_0_1px_rgba(167,243,208,0.08),0_24px_90px_-35px_rgba(34,211,238,0.55),0_24px_90px_-35px_rgba(147,51,234,0.45)] backdrop-blur-xl">
            <div className="rounded-[1.35rem] bg-[#071024]/90 p-4 ring-1 ring-white/[0.08]">
              <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.2em] text-white/45">AI operating console</p><p className="text-3xl font-semibold">Production stable</p></div><div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-200 ring-1 ring-emerald-300/30">● Operator-controlled</div></div>
              <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-violet-500/20 p-3 ring-1 ring-white/10"><p className="text-xs uppercase tracking-[0.2em] text-white/55">Active campaign</p><p className="text-2xl font-semibold">Q3 Growth Push</p><p className="text-sm text-white/75">12 assets in production · continuity retained</p></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">{[["Renders", "4 active"], ["Queue pressure", "Nominal"], ["Review throughput", "3 approvals"]].map((item) => <div key={item[0]} className="rounded-lg bg-white/[0.03] p-2.5 ring-1 ring-white/10"><p className="text-[10px] uppercase tracking-[0.2em] text-white/45">{item[0]}</p><p className="mt-1 text-sm">{item[1]}</p></div>)}</div>
              <div className="mt-4 rounded-xl bg-black/25 p-3 ring-1 ring-white/10"><p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Pipeline stack</p><div className="mt-2 space-y-1.5 text-xs text-white/75">{["Source intelligence", "Campaign planning", "Scene generation", "Review control", "Render/export", "Publishing prep", "Performance learning"].map((item, index) => <div key={item} className="grid grid-cols-[32px_1fr_auto] items-center gap-2"><span className="text-white/40">{String(index + 1).padStart(2, "0")}</span><div className="h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-300" style={{ width: `${45 + index * 7}%` }} /></div><span>{item}</span></div>)}</div></div>
              <div className="mt-3 grid gap-1.5 sm:grid-cols-2 text-xs">{["Render readiness nominal", "Campaign continuity retained", "Memory synchronized", "Queue stable"].map((item) => <div key={item} className="rounded-md bg-white/[0.03] px-2 py-1.5 ring-1 ring-white/10">{item}</div>)}</div>
            </div>
          </section>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{capabilities.map((item) => <article key={item.title} className="rounded-2xl bg-slate-950/60 p-5 ring-1 ring-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_44px_-30px_rgba(56,189,248,0.5)]"><div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accentMap[item.accent]} ring-1 ring-white/10`}>✦</div><h3 className="mt-3 text-2xl font-medium">{item.title}</h3><p className="mt-2 text-white/68">{item.body}</p><p className={`mt-4 text-sm ${item.accent === "amber" ? "text-amber-300" : item.accent === "violet" ? "text-violet-300" : item.accent === "blue" ? "text-blue-300" : "text-cyan-300"}`}>{item.link} →</p></article>)}</div>

        <div className="mt-6 grid gap-2 rounded-2xl bg-slate-950/60 p-3 ring-1 ring-white/[0.08] md:grid-cols-5">{bottomMetrics.map((item) => <div key={item.label} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10"><p className="text-[10px] uppercase tracking-[0.2em] text-white/45">{item.label}</p><p className={`text-lg ${item.accent}`}>{item.state}</p><div className="mt-1 flex items-center justify-between"><p className="text-sm text-white/80">{item.value}</p><span className="inline-flex h-1.5 w-14 rounded-full bg-gradient-to-r from-cyan-300/85 to-violet-300/85" /></div></div>)}</div>

        <section className="mt-8 rounded-[1.6rem] bg-slate-950/60 p-6 ring-1 ring-white/[0.08]"><h2 className="text-3xl font-semibold">Persistent AI memory, not disposable prompts.</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{memoryItems.map((item) => <div key={item} className="rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/10">{item}</div>)}</div></section>
        <section className="mt-8 rounded-[1.6rem] bg-slate-950/60 p-6 ring-1 ring-white/[0.08]"><h2 className="text-3xl font-semibold">What the AI operating system actually runs.</h2><p className="mt-3 text-white/68">Canonical generation, review, render, and publishing path with continuity tracking.</p></section>
        <section className="mt-8 grid gap-4 md:grid-cols-2"><article className="rounded-[1.6rem] bg-slate-950/60 p-6 ring-1 ring-white/[0.08]"><h3 className="text-2xl font-semibold">Campaign command</h3><p className="mt-3 text-white/68">One signal can become a full campaign system.</p></article><article className="rounded-[1.6rem] bg-slate-950/60 p-6 ring-1 ring-white/[0.08]"><h3 className="text-2xl font-semibold">Learning loop</h3><p className="mt-3 text-white/68">Every output teaches the next one.</p></article></section>
        <section className="mt-8 rounded-[1.6rem] bg-slate-950/60 p-6 ring-1 ring-white/[0.08]"><h2 className="text-2xl font-semibold">Built for operators, creators, and teams.</h2><div className="mt-4 flex flex-wrap gap-2">{audienceChips.map((chip) => <span key={chip} className="rounded-full bg-white/[0.04] px-3 py-1.5 text-sm ring-1 ring-white/10">{chip}</span>)}</div></section>
      </section>
      <div className="relative border-t border-white/10"><PricingSection /></div>
    </main>
  );
}
