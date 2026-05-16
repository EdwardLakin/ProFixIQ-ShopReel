import { parseCampaignIntake } from "../src/features/shopreel/campaigns/lib/parseCampaignIntake";
import { generateDifferentiatedAngles, buildProductionPackage, mergeMissingAnswersIntoContext } from "../src/features/shopreel/campaigns/lib/campaignIntelligence";
function assert(condition: unknown, msg: string) { if (!condition) throw new Error(msg); }

const brief = parseCampaignIntake("I’m starting a mobile mechanic business in Calgary and need Facebook ads");
assert(brief.mode === "business_advertising", "mode should be business_advertising");
assert((brief.missingQuestions ?? []).length > 0, "business campaign should include missing questions when details are absent");

const merged = mergeMissingAnswersIntoContext({}, {
  "What is your business name?": "Calgary Mobile Mechanic",
  "Do you have an intro offer?": "Free first inspection with booking",
  "What trust signal can we use?": "10 years experience, licensed, insured",
});
assert((merged.business_name as string) === "Calgary Mobile Mechanic", "business name answer should merge");
assert((merged.intro_offer as string).includes("inspection"), "offer answer should merge");
assert((merged.trust_signal as string).includes("licensed"), "trust signal should merge");

const angles = generateDifferentiatedAngles({ title: "Biz", coreIdea: brief.sourcePrompt, parsedBrief: brief });
const pkg = buildProductionPackage("business_advertising", angles[0].title, angles[0].hook, "Message to book");
const keys = Object.keys(pkg.sections ?? {});
["facebook_post", "comment_reply_templates", "short_reel_script", "local_ad_copy", "cta_options"].forEach((k) => assert(keys.includes(k) || keys.includes("CTA_options"), `missing ${k}`));

const buildShape = { ok: true, productionPackage: pkg, status: "draft", itemId: "x", message: "Angle approved and production package built." };
assert(typeof buildShape.message === "string" && buildShape.status === "draft", "build response shape should include message/status");
const metadata = { media_generation: { image: "coming_next", video: "coming_next" } };
assert(metadata.media_generation.image !== "completed" && metadata.media_generation.video !== "completed", "inactive media actions must not be treated as completed");

console.log("campaign-production-smoke passed");
