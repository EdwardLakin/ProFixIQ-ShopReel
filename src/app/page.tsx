import Link from "next/link";

const features = [
  {
    title: "Turn everyday work into content",
    body:
      "Convert photos, videos, notes, jobs, inspections, and completed work into publish-ready content ideas automatically.",
  },
  {
    title: "Review before anything goes live",
    body:
      "Keep humans in control with approval, render review, publish scheduling, and channel-specific output.",
  },
  {
    title: "Publish across every channel",
    body:
      "Manage short-form video, business updates, blog content, email content, and more from one workflow.",
  },
];

const audiences = [
  "Repair shops",
  "Contractors",
  "Clinics",
  "Home services",
  "Gyms",
  "Restaurants",
  "Agencies",
  "Local businesses",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(201,139,92,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(88,145,255,0.16),transparent_30%),#050505] text-white">
      <section className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.35em] text-[#d4a27d]">
              ShopReel
            </div>
            <div className="mt-2 text-sm text-white/60">
              AI content system for real businesses
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Start free
            </Link>
          </div>
        </div>

        <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-[rgba(212,162,125,0.22)] bg-[rgba(212,162,125,0.08)] px-4 py-2 text-sm text-[#e6bf9f]">
              Create once. Publish everywhere. Learn what works.
            </div>

            <h1 className="text-5xl font-semibold leading-[0.95] md:text-7xl">
              AI content automation for businesses that already have the raw material
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72 md:text-xl">
              ShopReel turns everyday operations into marketing output. It finds content
              opportunities, generates hooks and captions, queues renders, and helps your
              team publish consistent content without building a full media department.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-2xl bg-white px-6 py-3 font-semibold text-black transition hover:opacity-90"
              >
                Start free
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {audiences.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_0_60px_rgba(201,139,92,0.08)] backdrop-blur">
              <div className="text-sm uppercase tracking-[0.24em] text-[#d4a27d]">
                Workflow
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Find opportunities from real activity",
                  "Generate content ideas and platform variants",
                  "Render, review, approve, and schedule",
                  "Publish and learn from performance",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c98b5c] text-sm font-semibold text-black">
                      {index + 1}
                    </div>
                    <div className="text-sm text-white/84">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="text-sm uppercase tracking-[0.24em] text-[#d4a27d]">
                Output types
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Short-form video",
                  "Blog posts",
                  "Google Business posts",
                  "LinkedIn content",
                  "Email campaigns",
                  "Educational tips",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">{feature.body}</p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
