import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import PublishQueueClient from "@/features/shopreel/publishing/components/PublishQueueClient";
import { createAdminClient } from "@/lib/supabase/server";

export default async function ShopReelPublishQueuePage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const [{ data: jobs }, { data: publications }] = await Promise.all([
    legacy
      .from("shopreel_publish_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    legacy
      .from("content_publications")
      .select("*")
      .in("status", ["queued", "publishing", "failed"])
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const jobsList = jobs ?? [];
  const publicationsList = publications ?? [];

  const publicationIdsWithJobs = new Set<string>();
  for (const job of jobsList) {
    if (job.publication_id) {
      publicationIdsWithJobs.add(job.publication_id);
    }
  }

  const queuedPublicationsWithoutJobs = publicationsList.filter(
    (publication: any) => !publicationIdsWithJobs.has(publication.id)
  );

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Publish Queue"
      subtitle="Queued, processing, completed, and failed publish jobs."
    >
      <ShopReelNav />
      <PublishQueueClient
        initialJobs={jobsList}
        initialQueuedPublicationsWithoutJobs={queuedPublicationsWithoutJobs}
      />
    </GlassShell>
  );
}
