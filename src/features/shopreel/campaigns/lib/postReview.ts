import type { CampaignImagePurpose } from "@/features/shopreel/campaigns/lib/mediaGeneration";

type CampaignRow = { id: string; title: string; campaign_goal?: string | null; metadata?: unknown };
type ItemRow = { id: string; title: string; metadata?: unknown };
type CampaignPackage = { sections?: Record<string, string | string[]> };
type MediaView = { imageUrl?: string | null; imagePurpose?: CampaignImagePurpose | null };

export type PostReviewPayload = {
  headline: string;
  imageUrl: string | null;
  facebookPost: string;
  caption: string;
  ctaOptions: string[];
  commentReplies: string[];
  reelScript: string;
  campaignMode: string;
  sourceItemId: string;
  campaignId: string;
};

function toText(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value.join("\n") : value;
}
function toList(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : value.split(/\n+/).map((x) => x.trim()).filter(Boolean);
}

export function buildPostReviewPayload(args: { campaign: CampaignRow; item: ItemRow; productionPackage?: CampaignPackage | null; media?: MediaView | null; }) : PostReviewPayload {
  const sections = args.productionPackage?.sections ?? {};
  const campaignMeta = args.campaign.metadata && typeof args.campaign.metadata === "object" ? args.campaign.metadata as Record<string, unknown> : {};
  const mode = typeof campaignMeta.campaign_mode === "string" ? campaignMeta.campaign_mode : (args.campaign.campaign_goal ?? "general_campaign");

  const facebookPost = toText(sections.facebook_post as string | string[] | undefined) || toText(sections.local_ad_copy as string | string[] | undefined) || toText(sections.caption as string | string[] | undefined);
  return {
    headline: args.item.title || args.campaign.title,
    imageUrl: args.media?.imageUrl ?? null,
    facebookPost,
    caption: toText(sections.caption as string | string[] | undefined) || facebookPost,
    ctaOptions: toList((sections.cta_options as string | string[] | undefined) ?? (sections.CTA_options as string | string[] | undefined)),
    commentReplies: toList(sections.comment_reply_templates as string | string[] | undefined),
    reelScript: toText(sections.short_reel_script as string | string[] | undefined),
    campaignMode: mode,
    sourceItemId: args.item.id,
    campaignId: args.campaign.id,
  };
}

export function formatPostReviewCopy(payload: PostReviewPayload) {
  return [
    `Headline: ${payload.headline}`,
    payload.facebookPost ? `Facebook/Instagram Post:\n${payload.facebookPost}` : "",
    payload.ctaOptions.length ? `CTA Options:\n${payload.ctaOptions.map((v) => `- ${v}`).join("\n")}` : "",
    payload.commentReplies.length ? `Comment Replies:\n${payload.commentReplies.map((v) => `- ${v}`).join("\n")}` : "",
    payload.reelScript ? `Reel Script:\n${payload.reelScript}` : "",
  ].filter(Boolean).join("\n\n");
}

export function resolveCampaignOutputRoute(input: { itemId: string; campaignMode?: string | null; imagePurpose?: CampaignImagePurpose | null }) {
  if (input.campaignMode === "business_advertising" || input.imagePurpose === "static_ad") {
    return `/shopreel/campaigns/items/${input.itemId}/post-review`;
  }
  return `/shopreel/campaigns/items/${input.itemId}`;
}
