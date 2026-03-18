import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Database, Json } from "@/types/supabase";

type CampaignInsert =
  Database["public"]["Tables"]["shopreel_campaigns"]["Insert"];

type CampaignItemInsert =
  Database["public"]["Tables"]["shopreel_campaign_items"]["Insert"];

const DEFAULT_ANGLES = [
  "Problem",
  "Old Way",
  "New Way",
  "How It Works",
  "Outcome",
  "Call To Action",
] as const;

function buildCampaignPrompt(args: {
  coreIdea: string;
  angle: string;
  audience: string | null;
  offer: string | null;
  campaignGoal: string | null;
}) {
  const parts = [
    `Create a short cinematic vertical marketing video about ${args.coreIdea}.`,
    `Angle: ${args.angle}.`,
    args.audience ? `Audience: ${args.audience}.` : "",
    args.offer ? `Offer or promise: ${args.offer}.` : "",
    args.campaignGoal ? `Campaign goal: ${args.campaignGoal}.` : "",
    "Make it clear, modern, emotionally engaging, and platform-ready for short-form social video.",
  ].filter(Boolean);

  return parts.join(" ");
}

export async function createCampaign(args: {
  title: string;
  coreIdea: string;
  audience: string | null;
  offer: string | null;
  campaignGoal: string | null;
  platformFocus: string[];
}) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const campaignInsert: CampaignInsert = {
    shop_id: shopId,
    title: args.title,
    core_idea: args.coreIdea,
    audience: args.audience,
    offer: args.offer,
    campaign_goal: args.campaignGoal,
    platform_focus: args.platformFocus,
    status: "draft",
    metadata: {},
  };

  const { data: campaign, error: campaignError } = await supabase
    .from("shopreel_campaigns")
    .insert(campaignInsert)
    .select("*")
    .single();

  if (campaignError || !campaign?.id) {
    throw new Error(campaignError?.message ?? "Failed to create campaign");
  }

  const itemInserts: CampaignItemInsert[] = DEFAULT_ANGLES.map((angle, index) => ({
    campaign_id: campaign.id,
    shop_id: shopId,
    sort_order: index,
    angle,
    title: `${args.title} — ${angle}`,
    prompt: buildCampaignPrompt({
      coreIdea: args.coreIdea,
      angle,
      audience: args.audience,
      offer: args.offer,
      campaignGoal: args.campaignGoal,
    }),
    negative_prompt:
      "Avoid blurry visuals, distorted hands, low detail, unreadable text, cluttered composition.",
    style: "cinematic",
    visual_mode: "photoreal",
    aspect_ratio: "9:16",
    duration_seconds: 8,
    status: "draft",
    metadata: {
      generated_from_campaign: true,
      campaign_angle: angle,
    } satisfies Json,
  }));

  const { error: itemsError } = await supabase
    .from("shopreel_campaign_items")
    .insert(itemInserts);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return campaign.id;
}

export async function listRecentCampaigns(limit = 24) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_campaigns")
    .select(`
      *,
      items:shopreel_campaign_items(count)
    `)
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listCampaignItems(campaignId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("shop_id", shopId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}


export async function createMediaJobForCampaignItem(itemId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("id", itemId)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  if (item.media_job_id) {
    return item.media_job_id;
  }

  const { createMediaGenerationJob } = await import("@/features/shopreel/video-creation/lib/server");

  const mediaJob = await createMediaGenerationJob({
    title: item.title,
    prompt: item.prompt,
    negativePrompt: item.negative_prompt ?? "",
    jobType: "video",
    provider: "openai",
    style: (item.style as any) ?? "cinematic",
    visualMode: (item.visual_mode as any) ?? "photoreal",
    aspectRatio: (item.aspect_ratio as any) ?? "9:16",
    durationSeconds: Number(item.duration_seconds ?? 8),
    inputAssetIds: [],
  });

  const { error: updateError } = await supabase
    .from("shopreel_campaign_items")
    .update({
      media_job_id: mediaJob.id,
      status: "queued",
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return mediaJob.id;
}

export async function createAllMediaJobsForCampaign(campaignId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: items, error: itemsError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("shop_id", shopId)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const createdIds: string[] = [];

  for (const item of items ?? []) {
    if (item.media_job_id) {
      createdIds.push(item.media_job_id);
      continue;
    }

    const mediaJobId = await createMediaJobForCampaignItem(item.id);
    createdIds.push(mediaJobId);
  }

  return createdIds;
}


export async function listCampaignItemsWithMediaJobs(campaignId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data, error } = await supabase
    .from("shopreel_campaign_items")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs (
        id,
        status,
        provider,
        preview_url,
        output_asset_id,
        source_content_piece_id,
        source_generation_id,
        error_text,
        created_at,
        updated_at
      )
    `)
    .eq("campaign_id", campaignId)
    .eq("shop_id", shopId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function runMediaJobForCampaignItem(itemId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: item, error: itemError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("id", itemId)
    .eq("shop_id", shopId)
    .single();

  if (itemError || !item) {
    throw new Error(itemError?.message ?? "Campaign item not found");
  }

  if (!item.media_job_id) {
    throw new Error("Campaign item does not have a media job yet.");
  }

  const { processMediaGenerationJob } = await import("@/features/shopreel/video-creation/lib/server");
  const job = await processMediaGenerationJob(item.media_job_id);

  const { error: updateError } = await supabase
    .from("shopreel_campaign_items")
    .update({
      status: job.status,
      content_piece_id: job.source_content_piece_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return job.id;
}

export async function runAllMediaJobsForCampaign(campaignId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: items, error: itemsError } = await supabase
    .from("shopreel_campaign_items")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("shop_id", shopId)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const processedIds: string[] = [];

  for (const item of items ?? []) {
    if (!item.media_job_id) {
      continue;
    }
    const id = await runMediaJobForCampaignItem(item.id);
    processedIds.push(id);
  }

  return processedIds;
}

export async function generateCampaignEndToEnd(campaignId: string) {
  const createdJobIds = await createAllMediaJobsForCampaign(campaignId);
  const processedJobIds = await runAllMediaJobsForCampaign(campaignId);

  return {
    createdJobIds,
    processedJobIds,
  };
}


export async function syncProcessingMediaJobsForCampaign(campaignId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: items, error: itemsError } = await supabase
    .from("shopreel_campaign_items")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs (*)
    `)
    .eq("campaign_id", campaignId)
    .eq("shop_id", shopId)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const syncedJobIds: string[] = [];

  for (const item of items ?? []) {
    const mediaJob = Array.isArray(item.media_job) ? item.media_job[0] : item.media_job;
    if (!mediaJob?.id) continue;
    if (mediaJob.status !== "processing") continue;
    if (mediaJob.provider !== "openai" || mediaJob.job_type !== "video") continue;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/shopreel/video-creation/jobs/${mediaJob.id}/sync`,
      { method: "POST" }
    );

    if (!res.ok) {
      continue;
    }

    syncedJobIds.push(mediaJob.id);
  }

  return syncedJobIds;
}

export async function rollupCampaignAnalytics(campaignId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const { data: items, error: itemsError } = await supabase
    .from("shopreel_campaign_items")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs (
        id,
        status,
        source_content_piece_id
      )
    `)
    .eq("campaign_id", campaignId)
    .eq("shop_id", shopId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const normalizedItems = (items ?? []).map((item) => ({
    ...item,
    media_job: Array.isArray(item.media_job) ? item.media_job[0] ?? null : item.media_job,
  }));

  const contentPieceIds = normalizedItems
    .map((item) => item.media_job?.source_content_piece_id ?? item.content_piece_id ?? null)
    .filter((value): value is string => !!value);

  let publications: Array<{ id: string; status: string; content_piece_id: string }> = [];
  if (contentPieceIds.length > 0) {
    const { data: publicationRows, error: publicationsError } = await supabase
      .from("content_publications")
      .select("id, status, content_piece_id")
      .in("content_piece_id", contentPieceIds);

    if (publicationsError) {
      throw new Error(publicationsError.message);
    }

    publications = publicationRows ?? [];
  }

  let analyticsEvents: Array<{ publication_id: string | null; event_name: string; event_value: number | null }> = [];
  if (publications.length > 0) {
    const publicationIds = publications.map((row) => row.id);
    const { data: analyticsRows, error: analyticsError } = await supabase
      .from("content_analytics_events")
      .select("publication_id, event_name, event_value")
      .in("publication_id", publicationIds);

    if (analyticsError) {
      throw new Error(analyticsError.message);
    }

    analyticsEvents = analyticsRows ?? [];
  }

  const totalViews = analyticsEvents
    .filter((row) => row.event_name.toLowerCase().includes("view"))
    .reduce((sum, row) => sum + Number(row.event_value ?? 0), 0);

  const totalEngagement = analyticsEvents
    .filter((row) =>
      ["like", "comment", "share", "save", "engagement"].some((key) =>
        row.event_name.toLowerCase().includes(key)
      )
    )
    .reduce((sum, row) => sum + Number(row.event_value ?? 0), 0);

  const angleScores = normalizedItems.map((item) => {
    const cpId = item.media_job?.source_content_piece_id ?? item.content_piece_id ?? null;
    const itemPublications = publications.filter((pub) => pub.content_piece_id === cpId);
    const itemPublicationIds = itemPublications.map((pub) => pub.id);
    const itemEvents = analyticsEvents.filter((evt) =>
      evt.publication_id ? itemPublicationIds.includes(evt.publication_id) : false
    );

    const score = itemEvents.reduce((sum, evt) => sum + Number(evt.event_value ?? 0), 0);

    return {
      angle: item.angle,
      score,
      itemId: item.id,
    };
  });

  angleScores.sort((a, b) => b.score - a.score);
  const winningAngle = angleScores[0]?.score ? angleScores[0].angle : null;

  const payload = {
    campaign_id: campaignId,
    shop_id: shopId,
    total_items: normalizedItems.length,
    total_media_jobs: normalizedItems.filter((item) => item.media_job?.id).length,
    total_completed_jobs: normalizedItems.filter((item) => item.media_job?.status === "completed").length,
    total_content_pieces: contentPieceIds.length,
    total_publications: publications.length,
    total_published: publications.filter((row) => row.status === "published").length,
    total_views: totalViews,
    total_engagement: totalEngagement,
    winning_angle: winningAngle,
    summary: {
      angle_scores: angleScores,
    },
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("shopreel_campaign_analytics")
    .upsert(payload, { onConflict: "campaign_id" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return payload;
}

export async function extractCampaignLearnings(campaignId: string) {
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();

  const analytics = await rollupCampaignAnalytics(campaignId);

  const learningsToInsert = [];

  if (analytics.winning_angle) {
    learningsToInsert.push({
      campaign_id: campaignId,
      shop_id: shopId,
      campaign_item_id: null,
      learning_type: "winning_angle",
      learning_key: analytics.winning_angle,
      learning_value: {
        total_views: analytics.total_views,
        total_engagement: analytics.total_engagement,
        summary: analytics.summary,
      } satisfies Json,
      confidence: analytics.total_engagement > 0 ? 0.8 : 0.4,
    });
  }

  if (learningsToInsert.length > 0) {
    const { error } = await supabase
      .from("shopreel_campaign_learnings")
      .insert(learningsToInsert);

    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    inserted: learningsToInsert.length,
    winningAngle: analytics.winning_angle,
  };
}
