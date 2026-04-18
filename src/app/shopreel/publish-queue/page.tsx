import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import PublishQueueClient from "@/features/shopreel/publishing/components/PublishQueueClient";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  computePublishFailureDiagnostics,
  getPublishFailureNextAction,
} from "@/features/shopreel/operations/lib/publishFailureDiagnostics";

export default async function ShopReelPublishQueuePage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const [{ data: jobs }, { data: publications }, { data: accounts }] = await Promise.all([
    legacy
      .from("shopreel_publish_jobs")
      .select("id, publication_id, status, attempt_count, error_message, created_at, updated_at, completed_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(100),
    legacy
      .from("content_publications")
      .select("id, platform, status, created_at, updated_at, published_at, scheduled_for, error_text, metadata, content_piece_id, platform_post_url, platform_account_id")
      .or(`tenant_shop_id.eq.${shopId},source_shop_id.eq.${shopId}`)
      .in("status", ["queued", "publishing", "failed"])
      .order("created_at", { ascending: false })
      .limit(100),
    legacy
      .from("content_platform_accounts")
      .select("id")
      .eq("tenant_shop_id", shopId)
      .eq("connection_active", true),
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

  const contentPieceIds = Array.from(
    new Set(
      publicationsList
        .map((publication: any) => publication.content_piece_id)
        .filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const [contentPiecesResult, generationsResult] = await Promise.all([
    contentPieceIds.length
      ? legacy
          .from("content_pieces")
          .select("id, render_url")
          .in("id", contentPieceIds)
      : Promise.resolve({ data: [] }),
    contentPieceIds.length
      ? legacy
          .from("shopreel_story_generations")
          .select("id, content_piece_id")
          .eq("shop_id", shopId)
          .in("content_piece_id", contentPieceIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const contentPieceById = new Map<string, any>(
    ((contentPiecesResult.data ?? []) as any[]).map((row) => [row.id, row])
  );
  const generationByContentPieceId = new Map<string, any>();
  for (const row of ((generationsResult.data ?? []) as any[])) {
    if (typeof row.content_piece_id === "string" && !generationByContentPieceId.has(row.content_piece_id)) {
      generationByContentPieceId.set(row.content_piece_id, row);
    }
  }

  const jobByPublicationId = new Map<string, any>();
  for (const row of jobsList) {
    if (typeof row.publication_id === "string" && !jobByPublicationId.has(row.publication_id)) {
      jobByPublicationId.set(row.publication_id, row);
    }
  }

  const hasConnectedPlatformAccount = (accounts?.length ?? 0) > 0;

  const diagnostics = publicationsList.map((publication: any) => {
    const publishJob = jobByPublicationId.get(publication.id) ?? null;
    const contentPiece = publication.content_piece_id
      ? contentPieceById.get(publication.content_piece_id) ?? null
      : null;
    const generation = publication.content_piece_id
      ? generationByContentPieceId.get(publication.content_piece_id) ?? null
      : null;

    const failure = computePublishFailureDiagnostics({
      publication,
      publishJob,
      contentPiece,
      hasConnectedPlatformAccount,
    });
    const nextAction = getPublishFailureNextAction({
      reason: failure.reason,
      generationId: generation?.id ?? null,
      contentPieceId: publication.content_piece_id ?? null,
      retryable: failure.retryable,
    });

    return {
      publication,
      publishJob,
      contentPieceId: publication.content_piece_id ?? null,
      generationId: generation?.id ?? null,
      diagnostics: failure,
      nextAction,
    };
  });

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Publish Queue"
      subtitle="Operational publish queue and failure diagnostics."
    >
      <ShopReelNav />
      <PublishQueueClient
        initialJobs={jobsList}
        initialQueuedPublicationsWithoutJobs={queuedPublicationsWithoutJobs}
        initialDiagnostics={diagnostics}
      />
    </GlassShell>
  );
}
