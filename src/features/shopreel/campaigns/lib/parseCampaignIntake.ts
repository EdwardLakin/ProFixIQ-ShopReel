import type { CampaignMode, ParsedCampaignBrief } from "@/features/shopreel/campaigns/lib/campaignIntakeTypes";

const MODE_RULES: Array<{ mode: CampaignMode; keywords: string[] }> = [
  { mode: "internal_self_marketing", keywords: ["advertise shopreel", "market shopreel", "shopreel using shopreel"] },
  { mode: "uploaded_asset", keywords: ["upload", "uploaded", "photo", "image", "before and after", "before/after", "turn this into content"] },
  { mode: "campaign_refine", keywords: ["improve this", "make this better", "rewrite", "less generic", "refine"] },
  { mode: "publish_learning", keywords: ["schedule", "publish", "what worked", "performance", "make more like last one"] },
  { mode: "weekly_content", keywords: ["week of posts", "content calendar", "monthly content", "daily posts"] },
  { mode: "launch_campaign", keywords: ["launch", "release", "announce", "new app", "new product", "campaign for"] },
  { mode: "business_advertising", keywords: ["business", "startup", "starting", "local", "customers", "facebook ads", "advertise", "service", "bookings", "leads", "clients"] },
];

const MODE_OUTPUTS: Record<CampaignMode, string[]> = {
  business_advertising: ["facebook_post", "short_reel_script", "comment_reply_templates", "local_ad_copy", "cta_options"],
  launch_campaign: ["positioning", "launch_posts", "founder_story", "short_form_video_concepts", "landing_page_copy", "launch_email"],
  weekly_content: ["content_calendar", "post_ideas", "captions", "reel_scripts", "hooks"],
  uploaded_asset: ["caption", "before_after_post", "reel_script", "overlay_text", "thumbnail_title"],
  campaign_refine: ["diagnosis", "rewritten_hook", "rewritten_caption", "alternate_angles", "before_after_comparison"],
  publish_learning: ["publish_checklist", "schedule", "platform_versions", "next_campaign_recommendations"],
  internal_self_marketing: ["positioning", "launch_posts", "short_form_video_concepts", "cta_options"],
  general_campaign: ["post_ideas", "captions", "reel_scripts"],
};

const MISSING_BY_MODE: Partial<Record<CampaignMode, string[]>> = {
  business_advertising: [
    "What is your business name?",
    "What service area should we mention?",
    "What main service should we lead with?",
    "Do you have an intro offer for first-time customers?",
    "What trust signal can we use (reviews, years of experience, licensed/insured)?",
    "What is the best booking/contact method (DM, text, call, booking link)?",
  ],
  launch_campaign: ["What is launching and when?", "What is the primary conversion event?"],
  weekly_content: ["Which platforms should receive weekly content?", "What topics are highest-priority this week?"],
  uploaded_asset: ["Which platform is this asset for?", "What is the CTA for this asset?"],
};

function cleanMatch(value: string | undefined) {
  return value?.trim().replace(/[.!,;:]$/, "") || null;
}

function detectMode(promptLower: string): { mode: CampaignMode; confidence: number; notes: string[] } {
  for (const rule of MODE_RULES) {
    const hits = rule.keywords.filter((keyword) => promptLower.includes(keyword));
    if (hits.length > 0) {
      const confidence = Math.min(0.98, 0.55 + hits.length * 0.14);
      return { mode: rule.mode, confidence, notes: [`Matched ${rule.mode} via: ${hits.join(", ")}`] };
    }
  }
  return { mode: "general_campaign", confidence: 0.45, notes: ["No strong mode keywords detected."] };
}

export function parseCampaignIntake(sourcePrompt: string): ParsedCampaignBrief {
  const prompt = sourcePrompt.trim();
  const lower = prompt.toLowerCase();
  const modeDetection = detectMode(lower);

  const platformFocus = Array.from(new Set([
    /facebook/.test(lower) ? "facebook" : "",
    /instagram/.test(lower) ? "instagram" : "",
    /tiktok/.test(lower) ? "tiktok" : "",
    /youtube/.test(lower) ? "youtube" : "",
    /linkedin/.test(lower) ? "linkedin" : "",
    /(?:\bx\b|twitter)/.test(lower) ? "x" : "",
  ].filter(Boolean)));

  const location = cleanMatch(prompt.match(/\b(?:in|around|near|serving|across)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/)?.[1]);
  const businessType = cleanMatch(prompt.match(/(?:starting|opening|promote|promoting|help me promote)\s+(?:a|an|my)?\s*([a-z][a-z\s]+?)\s+(?:business|service|shop|company)/i)?.[1]) ??
    cleanMatch(prompt.match(/(?:i['’]m|i am)\s+(?:starting|opening)\s+(?:a|an)\s+([a-z][a-z\s]+?)(?:\s+and|\s*$)/i)?.[1]) ??
    cleanMatch(prompt.match(/(?:i do|we do|my)\s+([a-z][a-z\s]+?)(?:\s+(?:and|to|for|in)\b|$)/i)?.[1]) ??
    cleanMatch(prompt.match(/\b([a-z][a-z\s]+?)\s+(?:business|service|shop|company)\b/i)?.[1]);

  const serviceCategory = businessType
    ? cleanMatch(businessType.replace(/\b(mobile|local|small|startup|side)\b/gi, "").replace(/\s+/g, " "))
    : null;
  const goal = cleanMatch(prompt.match(/(get customers|get leads|launch|awareness|bookings|sales|promote)/i)?.[1]);
  const tone = cleanMatch(prompt.match(/(?:tone|style)\s*(?:is|:)?\s*([^.,\n]+)/i)?.[1]);
  const offer = cleanMatch(prompt.match(/(?:offer|discount|promo|free|first[- ]time|intro)\s*([^.,\n]*)/i)?.[0]);
  const audience = cleanMatch(prompt.match(/\bfor\s+([^.,\n]+)/i)?.[1]);
  const isBusinessAdvertising = modeDetection.mode === "business_advertising";
  const targetCustomer = audience ?? (isBusinessAdvertising ? "Local customers who need this service soon" : null);
  const primaryProblem = isBusinessAdvertising ? "Needs a steady flow of local customer inquiries and bookings" : null;
  const servicePromise = isBusinessAdvertising ? `Fast, practical ${serviceCategory ?? businessType ?? "service"} support with clear communication` : null;
  const trustSignals = isBusinessAdvertising ? ["Local business", "Responsive support"] : [];
  const bookingAction = isBusinessAdvertising
    ? (/year\/make\/model/i.test(lower) ? "Send your year/make/model by message" : /dm|message|facebook/i.test(lower) ? "Message to book" : "DM for a quote")
    : null;
  const urgency = isBusinessAdvertising ? (/today|this week|now|asap|opening|starting/.test(lower) ? "high" : "medium") : null;
  const localTone = isBusinessAdvertising ? "direct, neighborly, and practical" : null;

  const missingQuestions = (MISSING_BY_MODE[modeDetection.mode] ?? []).filter((question) => {
    if (question.toLowerCase().includes("ideal customer") && audience) return false;
    if (question.toLowerCase().includes("offer") && offer) return false;
    if (question.toLowerCase().includes("service area") && location) return false;
    if (question.toLowerCase().includes("main service") && serviceCategory) return false;
    if (question.toLowerCase().includes("booking") && bookingAction) return false;
    return true;
  }).slice(0, 4);

  return {
    mode: modeDetection.mode,
    confidence: Number(modeDetection.confidence.toFixed(2)),
    sourcePrompt: prompt,
    businessName: cleanMatch(prompt.match(/\b(?:for|about)\s+([A-Z][\w&\s-]{2,40})/)?.[1]),
    productName: cleanMatch(prompt.match(/\b(?:launch|release|announce)\s+([A-Z][\w\s-]{2,40})/i)?.[1]),
    businessType,
    serviceCategory,
    location,
    audience,
    goal,
    offer,
    platformFocus,
    tone,
    targetCustomer,
    primaryProblem,
    servicePromise,
    trustSignals,
    bookingAction,
    urgency,
    localTone,
    painPoints: primaryProblem ? [primaryProblem] : [],
    proofPoints: trustSignals,
    desiredOutputs: isBusinessAdvertising
      ? ["facebook_post", "comment_reply_templates", "short_reel_script", "local_ad_copy", "cta_options", "follow_up_post_ideas"]
      : MODE_OUTPUTS[modeDetection.mode],
    missingQuestions,
    notes: modeDetection.notes,
  };
}
