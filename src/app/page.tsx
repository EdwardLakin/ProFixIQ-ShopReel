import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <div className="mb-4 text-sm uppercase tracking-[0.3em] text-[#c98b5c]">
            ShopReel
          </div>

          <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
            AI content automation for modern repair shops
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/70 md:text-xl">
            Turn real work orders, inspections, photos, and shop moments into
            publish-ready content with one clean workflow.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-2xl bg-white px-6 py-3 font-medium text-black"
            >
              Start free
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Find opportunities</h2>
            <p className="mt-2 text-sm text-white/70">
              Surface repair stories, inspection highlights, before-and-after
              moments, and educational tips from live shop activity.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Render and review</h2>
            <p className="mt-2 text-sm text-white/70">
              Build concepts, queue renders, review output, and keep the workflow
              controlled before publishing.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Publish everywhere</h2>
            <p className="mt-2 text-sm text-white/70">
              Connect Instagram, Facebook, TikTok, and YouTube, then push
              content from one dashboard.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
