import Link from "next/link";

const steps = [
  {
    title: "Define your brand voice",
    body: "Set your tone, CTA, and messaging style so generated content sounds like your business.",
  },
  {
    title: "Choose your channels",
    body: "Enable the platforms and destinations you want to publish to first.",
  },
  {
    title: "Connect accounts",
    body: "Link the channels you want to use now, then add more over time as your workflow expands.",
  },
  {
    title: "Start generating",
    body: "Turn real work, media, and business moments into content opportunities and drafts.",
  },
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_34%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <div className="mb-3 text-sm uppercase tracking-[0.28em] text-cyan-300/80">
            Onboarding
          </div>
          <h1 className="text-4xl font-semibold md:text-6xl">
            Let’s get your content engine ready.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
            Set your brand basics, enable your channels, and move into the app with a clean
            starting point.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/shopreel/billing"
              className="rounded-2xl bg-white px-6 py-3 font-medium text-black"
            >
              Start trial / choose plan
            </Link>
            <Link
              href="/shopreel/settings"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white"
            >
              Set brand voice
            </Link>
            <Link
              href="/shopreel"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white"
            >
              Skip to dashboard
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <h2 className="text-xl font-semibold text-white">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
