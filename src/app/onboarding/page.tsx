import Link from "next/link";

const steps = [
  { title: "Define your brand voice", body: "Set tone, CTA, positioning, and messaging rules so generated content sounds like your business." },
  { title: "Choose your channels", body: "Pick the first destinations you want ShopReel to prepare content for." },
  { title: "Connect accounts", body: "Connect publishing destinations when ready. MVP workflows remain manual-first and operator controlled." },
  { title: "Start generating", body: "Turn media, ideas, and business moments into draft content, campaigns, and export-ready assets." },
];

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02040d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(124,58,237,0.34),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(34,211,238,0.24),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_22%,rgba(255,255,255,0.02))]" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_20%_0%,rgba(124,58,237,0.22),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.085),rgba(255,255,255,0.035))] p-6 shadow-[0_34px_110px_rgba(0,0,0,0.58)] backdrop-blur-2xl md:p-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-200/85">Onboarding</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">Set up your creative operating system.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">Configure your brand, channels, and workflow so ShopReel can generate content with the right context from day one.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shopreel/billing" className="rounded-2xl border border-cyan-300/35 bg-[linear-gradient(135deg,rgba(124,58,237,0.92),rgba(34,211,238,0.82))] px-6 py-3 font-semibold text-white shadow-[0_16px_46px_rgba(34,211,238,0.22)]">Start trial / choose plan</Link>
            <Link href="/shopreel/settings" className="rounded-2xl border border-white/12 bg-white/[0.06] px-6 py-3 font-medium text-white">Set brand voice</Link>
            <Link href="/shopreel" className="rounded-2xl border border-white/12 bg-white/[0.04] px-6 py-3 font-medium text-white/82">Skip to dashboard</Link>
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-sm font-semibold text-cyan-100">{index + 1}</div>
              <h2 className="text-xl font-semibold text-white">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
