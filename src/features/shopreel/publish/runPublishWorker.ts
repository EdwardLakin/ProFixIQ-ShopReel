import { createAdminClient } from "@/lib/supabase/server";
import { createPublicationBundle } from "@/features/shopreel/publishing/lib/createPublicationBundle";
import { processPublishJob } from "@/features/shopreel/publishing/lib/processPublishJob";
import type { ShopReelPlatform } from "@/features/shopreel/integrations/shared/types";

type ContentPieceRow = {
  id: string;
  tenant_shop_id: string;
  title: string | null;
  caption: string | null;
  published_at: string | null;
};

type ConnectedPlatformRow = {
  platform: string | null;
};

type PublicationRow = {
  id: string;
  content_piece_id: string | null;
  platform: string | null;
  status: string | null;
};

type PublishJobRow = {
  id: string;
  publication_id: string;
};

type AutoPublishPlatform = "facebook" | "instagram" | "tiktok" | "youtube";

const AUTO_PUBLISH_PLATFORMS: AutoPublishPlatform[] = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube",
];

function isAutoPublishPlatform(value: string | null): value is AutoPublishPlatform {
  return (
    value === "facebook" ||
    value === "instagram" ||
    value === "tiktok" ||
    value === "youtube"
  );
}

async function getConnectedPlatforms(shopId: string): Promise<AutoPublishPlatform[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_platform_accounts")
    .select("platform")
    .eq("tenant_shop_id", shopId)
    .eq("connection_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ConnectedPlatformRow[];
  const unique = new Set<AutoPublishPlatform>();

  for (const row of rows) {
    if (
      isAutoPublishPlatform(row.platform) &&
      AUTO_PUBLISH_PLATFORMS.includes(row.platform)
    ) {
      unique.add(row.platform);
    }
  }

  return Array.from(unique);
}

export async function runPublishWorker(args: {
  shopId: string;
  contentPieceId?: string | null;
}) {
  const supabase = createAdminClient();
  const contentPieceId = args.contentPieceId ?? null;

  let query = supabase
    .from("content_pieces")
    .select("id, tenant_shop_id, title, caption, published_at")
    .eq("tenant_shop_id", args.shopId)
    .eq("status", "ready")
    .is("published_at", null)
    .limit(25);

  if (contentPieceId) {
    query = query.eq("id", contentPieceId);
  }

  const { data: ready, error: readyError } = await query;

  if (readyError) {
    throw new Error(readyError.message);
  }

  const items = (ready ?? []) as ContentPieceRow[];

  let attempted = 0;
  let published = 0;
  let failed = 0;
  const dueJobIds: string[] = [];

  for (const item of items) {
    attempted += 1;

    const targets = await getConnectedPlatforms(item.tenant_shop_id);

    if (targets.length === 0) {
      await supabase
        .from("content_calendar_items")
        .update({
          status: "failed_publish",
          updated_at: new Date().toISOString(),
        })
        .eq("content_piece_id", item.id);

      failed += 1;
      continue;
    }

    const { data: existingPublications, error: existingPublicationsError } = await supabase
      .from("content_publications")
      .select("id, content_piece_id, platform, status")
      .eq("tenant_shop_id", item.tenant_shop_id)
      .eq("content_piece_id", item.id);

    if (existingPublicationsError) {
      throw new Error(existingPublicationsError.message);
    }

    const publications = (existingPublications ?? []) as PublicationRow[];

    for (const platform of targets) {
      const existing = publications.find(
        (row) =>
          row.content_piece_id === item.id &&
          row.platform === platform &&
          row.status !== "failed",
      );

      if (existing) {
        const { data: existingJob, error: existingJobError } = await supabase
          .from("shopreel_publish_jobs")
          .select("id, publication_id")
          .eq("publication_id", existing.id)
          .in("status", ["queued", "processing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingJobError) {
          throw new Error(existingJobError.message);
        }

        const job = (existingJob ?? null) as PublishJobRow | null;
        if (job?.id) {
          dueJobIds.push(job.id);
        }

        continue;
      }

      const bundle = await createPublicationBundle({
        shopId: item.tenant_shop_id,
        contentPieceId: item.id,
        platform,
        publishMode: "autopilot",
        scheduledFor: new Date().toISOString(),
        title: item.title,
        caption: item.caption,
        enqueueNow: true,
      });

      if (bundle.publishJob?.id) {
        dueJobIds.push(bundle.publishJob.id);
      }
    }
  }

  const { data: queuedJobs, error: queuedJobsError } = await supabase
    .from("shopreel_publish_jobs")
    .select("id, publication_id")
    .eq("shop_id", args.shopId)
    .eq("status", "queued")
    .lte("run_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(25);

  if (queuedJobsError) {
    throw new Error(queuedJobsError.message);
  }

  for (const job of ((queuedJobs ?? []) as PublishJobRow[])) {
    if (!dueJobIds.includes(job.id)) {
      dueJobIds.push(job.id);
    }
  }

  for (const jobId of dueJobIds) {
    try {
      const result = await processPublishJob(jobId);

      const publicationId =
        result && typeof result === "object" && "publicationId" in result
          ? String((result as { publicationId: string }).publicationId)
          : null;

      if (!publicationId) continue;

      const { data: publicationRow, error: publicationRowError } = await supabase
        .from("content_publications")
        .select("content_piece_id, status")
        .eq("id", publicationId)
        .maybeSingle();

      if (publicationRowError) {
        throw new Error(publicationRowError.message);
      }

      const publication = publicationRow as { content_piece_id: string | null; status: string | null } | null;

      if (!publication?.content_piece_id) continue;

      if (publication.status === "published") {
        await supabase
          .from("content_pieces")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", publication.content_piece_id);

        await supabase
          .from("content_calendar_items")
          .update({
            status: "published",
            updated_at: new Date().toISOString(),
          })
          .eq("content_piece_id", publication.content_piece_id);

        published += 1;
      }
    } catch {
      failed += 1;
    }
  }

  return {
    published,
    attempted,
    failed,
    processedJobs: dueJobIds.length,
  };
}
