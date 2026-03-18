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
    .select("*")
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
