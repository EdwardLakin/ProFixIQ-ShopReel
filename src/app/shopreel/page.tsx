//src/app/shopreel/page.tsx

import ShopReelShell from "@/features/shopreel/ui/ShopReelShell";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";
import ShopReelCard from "@/features/shopreel/ui/ShopReelCard";
import ShopReelStat from "@/features/shopreel/ui/ShopReelStat";
import Link from "next/link";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

async function getJson(path: string) {
  const base = getBaseUrl();

  try {
    const response = await fetch(`${base}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export default async function ShopReelHomePage() {
  const jobsResponse = await getJson(
    `/api/shopreel/render-jobs?shopId=${DEFAULT_SHOP_ID}`,
  );

  const jobs =
    jobsResponse &&
    typeof jobsResponse === "object" &&
    "jobs" in jobsResponse &&
    Array.isArray((jobsResponse as { jobs?: unknown[] }).jobs)
      ? ((jobsResponse as { jobs: unknown[] }).jobs ?? [])
      : [];

  const queued = jobs.filter(
    (job) =>
      typeof job === "object" &&
      job !== null &&
      "status" in job &&
      (job as { status?: string }).status === "queued",
  ).length;

  const rendering = jobs.filter(
    (job) =>
      typeof job === "object" &&
      job !== null &&
      "status" in job &&
      (job as { status?: string }).status === "rendering",
  ).length;

  const ready = jobs.filter(
    (job) =>
      typeof job === "object" &&
      job !== null &&
      "status" in job &&
      (job as { status?: string }).status === "ready",
  ).length;

  const published = jobs.filter(
    (job) =>
      typeof job === "object" &&
      job !== null &&
      "status" in job &&
      (job as { status?: string }).status === "published",
  ).length;

  return (
    <ShopReelShell
      title="ShopReel Dashboard"
      subtitle="AI content engine for repair shops. Monitor opportunities, calendars, render jobs, and publishing flow from one place."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ShopReelStat label="Queued Jobs" value={queued} />
        <ShopReelStat label="Rendering" value={rendering} />
        <ShopReelStat label="Ready" value={ready} />
        <ShopReelStat label="Published" value={published} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ShopReelCard title="Quick Actions" eyebrow="Control Center">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/shopreel/opportunities"
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            >
              View detected opportunities
            </Link>
            <Link
              href="/shopreel/calendar"
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            >
              Review content calendar
            </Link>
            <Link
              href="/shopreel/render-queue"
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            >
              Inspect render queue
            </Link>
            <Link
              href="/shopreel/analytics"
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
            >
              See learning signals
            </Link>
          </div>
        </ShopReelCard>

        <ShopReelCard title="System Status" eyebrow="Pipeline">
          <div className="space-y-3 text-sm text-white/75">
            <p>Discovery engine: online</p>
            <p>Hook engine: online</p>
            <p>Calendar generation: online</p>
            <p>Render queue: online</p>
            <p>Worker pipeline: online</p>
          </div>
        </ShopReelCard>
      </div>
    </ShopReelShell>
  );
}
