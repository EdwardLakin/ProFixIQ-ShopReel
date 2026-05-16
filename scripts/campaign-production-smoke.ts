import { parseCampaignIntake } from "../src/features/shopreel/campaigns/lib/parseCampaignIntake";
import { generateDifferentiatedAngles, buildProductionPackage } from "../src/features/shopreel/campaigns/lib/campaignIntelligence";
function assert(condition: unknown, msg: string) { if (!condition) throw new Error(msg); }

const businessPrompts = [
  "I’m starting a mobile mechanic business in Calgary and need Facebook ads",
  "I do mobile detailing and need posts to get bookings",
  "I’m opening a small bakery and need local ads",
  "Help me promote my landscaping business on Facebook",
];

for (const prompt of businessPrompts) {
  const brief = parseCampaignIntake(prompt);
  assert(brief.mode === "business_advertising", "mode should be business_advertising");
  assert(!!brief.businessType || !!brief.serviceCategory, "business/service type should be inferred");
  if (/calgary/i.test(prompt)) assert((brief.location ?? "").toLowerCase().includes("calgary"), "location should include Calgary");
  const outputs = brief.desiredOutputs.join(" ").toLowerCase();
  assert(outputs.includes("facebook_post"), "outputs should include Facebook post");
  assert(outputs.includes("comment_reply"), "outputs should include comment replies");
  assert(outputs.includes("short_reel_script"), "outputs should include reel script");
  assert(outputs.includes("local_ad_copy"), "outputs should include local ad copy");

  const angles = generateDifferentiatedAngles({ title: "Biz", coreIdea: brief.sourcePrompt, parsedBrief: brief });
  assert(angles.length >= 5, "business angles should include full set");
  const pkg = buildProductionPackage("business_advertising", angles[0].title, angles[0].hook, "Message to book");
  const blob = JSON.stringify(pkg.sections).toLowerCase();
  assert(blob.includes("facebook_post") || blob.includes("facebook"), "package should include facebook post");
  assert(blob.includes("comment_reply"), "package should include comment replies");
  assert(blob.includes("short_reel_script") || blob.includes("scene 1"), "package should include reel script");
  assert(blob.includes("local_ad_copy") || blob.includes("headline"), "package should include local ad copy");
  assert(blob.includes("cta_options"), "package should include cta options");
  assert(blob.includes("book") || blob.includes("message") || blob.includes("quote"), "package should include booking language");
}

console.log("campaign-production-smoke passed");
