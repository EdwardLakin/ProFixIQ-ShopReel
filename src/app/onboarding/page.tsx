import Link from "next/link";

const steps = [
  "Set your brand voice and default CTA",
  "Choose your preferred content format and timezone",
  "Connect your first publishing channels",
  "Review opportunities and publish your first piece",
];

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,139,92,0.18),transparent_32%),#050505] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="text-sm uppercase tracking-[0.3em] text-[#d4a27d]">
            Welcome
          </div>

          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            Let’s get your content system ready
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/72">
            Your account is active. Next, configure the basics so ShopReel can start
            generating content opportunities and connect your first publishing channels.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#c98b5c] font-semibold text-black">
                  {index + 1}
                </div>
                <div className="text-base text-white/90">{step}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/shopreel/settings"
              className="rounded-2xl bg-white px-6 py-3 font-semibold text-black"
            >
              Open settings
            </Link>

            <Link
              href="/shopreel"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white"
            >
              Go to app
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
