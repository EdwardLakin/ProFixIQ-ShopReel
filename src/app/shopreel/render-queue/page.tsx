import ShopReelShell from "@/features/shopreel/ui/ShopReelShell";
import ShopReelCard from "@/features/shopreel/ui/ShopReelCard";
import ShopReelBadge from "@/features/shopreel/ui/ShopReelBadge";
import ShopReelEmpty from "@/features/shopreel/ui/ShopReelEmpty";
import ShopReelKeyValue from "@/features/shopreel/ui/ShopReelKeyValue";
import ShopReelListItem from "@/features/shopreel/ui/ShopReelListItem";
import ShopReelStat from "@/features/shopreel/ui/ShopReelStat";
import { getBaseUrl } from "@/features/shopreel/lib/getBaseUrl";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

type RenderJob = {
  id?: string;
  status?: string;
  source_type?: string;
  source_id?: string;
  work_order_id?: string | null;
  output_url?: string | null;
  thumbnail_url?: string | null;
  created_at?: string;
};

async function getJson(path: string) {
  const base = getBaseUrl();

  try {
    const response = await fetch(`${base}${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as { jobs?: RenderJob[] } | null;
  } catch {
    return null;
  }
}

function byStatus(jobs: RenderJob[], status: string) {
  return jobs.filter((job) => job.status === status);
}

export default async function ShopReelRenderQueuePage() {
  const data = await getJson(`/api/shopreel/render-jobs?shopId=${DEFAULT_SHOP_ID}`);
  const jobs = Array.isArray(data?.jobs) ? data!.jobs : [];

  const queued = byStatus(jobs, "queued");
  const rendering = byStatus(jobs, "rendering");
  const ready = byStatus(jobs, "ready");
  const published = byStatus(jobs, "published");

  return (
    <ShopReelShell
      title="Render Queue"
      subtitle="Queued, rendering, ready, published, and failed reel jobs."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ShopReelStat label="Queued" value={queued.length} />
        <ShopReelStat label="Rendering" value={rendering.length} />
        <ShopReelStat label="Ready" value={ready.length} />
        <ShopReelStat label="Published" value={published.length} />
      </div>

      <div className="mt-6">
        <ShopReelCard title="Render Jobs" eyebrow="Pipeline Queue">
          {jobs.length === 0 ? (
            <ShopReelEmpty message="No render jobs found." />
          ) : (
            <div className="grid gap-4">
              {jobs.map((job, index) => (
                <ShopReelListItem
                  key={job.id ?? `job-${index}`}
                  title={job.work_order_id ?? job.id ?? "Render job"}
                  subtitle={job.output_url ?? "Render output not ready yet"}
                  right={
                    <ShopReelBadge
                      tone={
                        job.status === "ready" || job.status === "published"
                          ? "green"
                          : job.status === "rendering"
                            ? "cyan"
                            : "neutral"
                      }
                    >
                      {job.status ?? "unknown"}
                    </ShopReelBadge>
                  }
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <ShopReelKeyValue label="Source Type" value={job.source_type} />
                    <ShopReelKeyValue label="Source ID" value={job.source_id} />
                    <ShopReelKeyValue label="Work Order" value={job.work_order_id} />
                    <ShopReelKeyValue label="Created" value={job.created_at} />
                  </div>
                </ShopReelListItem>
              ))}
            </div>
          )}
        </ShopReelCard>
      </div>
    </ShopReelShell>
  );
}
