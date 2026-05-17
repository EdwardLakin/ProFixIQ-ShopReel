import { buildPostReviewPayload, formatPostReviewCopy, resolveCampaignOutputRoute } from "../src/features/shopreel/campaigns/lib/postReview";

function assert(condition: unknown, message: string) { if (!condition) throw new Error(message); }

const payload = buildPostReviewPayload({
  campaign: { id: "c1", title: "Local ads", campaign_goal: "business_advertising", metadata: { campaign_mode: "business_advertising" } },
  item: { id: "i1", title: "Spring promo" },
  productionPackage: { sections: { facebook_post: "Book now", cta_options: ["Call now", "Message now"], comment_reply_templates: ["Thanks! DM us."], local_ad_copy: "Local copy", short_reel_script: "Scene 1" } },
  media: { imageUrl: "https://example.com/ad.png", imagePurpose: "static_ad" },
});
assert(payload.imageUrl === "https://example.com/ad.png", "imageUrl included");
assert(payload.facebookPost.includes("Book now"), "facebook post included");
assert(payload.ctaOptions.length > 0, "cta included");
assert(payload.commentReplies.length > 0, "replies included");

const formatted = formatPostReviewCopy(payload);
assert(formatted.includes("Facebook/Instagram Post"), "formatted includes post");
assert(formatted.includes("CTA Options"), "formatted includes cta");
assert(formatted.includes("Comment Replies"), "formatted includes replies");

assert(resolveCampaignOutputRoute({ itemId: "i1", campaignMode: "business_advertising", imagePurpose: "static_ad" }).endsWith("/post-review"), "business routes to review");
assert(resolveCampaignOutputRoute({ itemId: "i1", campaignMode: "launch_campaign", imagePurpose: "video_reference" }).endsWith("/shopreel/campaigns/items/i1"), "video route unchanged");

console.log("campaign-post-review-smoke passed");
