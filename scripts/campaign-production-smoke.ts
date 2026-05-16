import { parseCampaignIntake } from "../src/features/shopreel/campaigns/lib/parseCampaignIntake";
import { generateDifferentiatedAngles, buildProductionPackage } from "../src/features/shopreel/campaigns/lib/campaignIntelligence";

function assert(condition: unknown, msg: string) { if (!condition) throw new Error(msg); }
function hasAtLeastThreeUsefulSections(pkg: ReturnType<typeof buildProductionPackage>) {
  return Object.entries(pkg.sections).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? "").trim().length > 0;
  }).length >= 3;
}

const business = parseCampaignIntake("I need facebook ads for my local HVAC business in Denver");
assert(business.mode === "business_advertising", "business mode expected");
const businessAngles = generateDifferentiatedAngles({ title: "HVAC Growth", coreIdea: business.sourcePrompt, parsedBrief: business });
assert(businessAngles.some((a) => a.angle === "local_trust"), "business-specific angle missing");

const launch = parseCampaignIntake("Launch our new productivity app next month");
const launchAngles = generateDifferentiatedAngles({ title: "Launch", coreIdea: launch.sourcePrompt, parsedBrief: launch });
assert(launchAngles.some((a) => a.angle === "category_problem"), "launch-specific angle missing");
assert(launchAngles.length >= 3, "launch mode should provide at least 3 angles");

for (const angle of businessAngles) {
  const pkgFromAngle = buildProductionPackage("business_advertising", angle.title, angle.hook, "Book now");
  assert(angle.title && angle.hook && angle.objection && angle.emotionalOutcome, "angle core fields missing");
  assert(hasAtLeastThreeUsefulSections(pkgFromAngle), "production package must include at least 3 useful sections");
}

const pkg = buildProductionPackage("business_advertising", "Local Trust", "Your neighbors trust us", "Book now");
assert(!!(pkg.sections as any).facebook_post, "package missing facebook_post");
assert(!!(pkg.sections as any).short_reel_script, "package missing short_reel_script");
assert(JSON.stringify(pkg.sections).toLowerCase().includes("facebook"), "business package should contain facebook-oriented content");
assert(JSON.stringify(pkg.sections).toLowerCase().includes("local"), "business package should contain local-focused content");
assert(JSON.stringify(pkg.sections).toLowerCase().includes("reply"), "business package should contain comment-reply style content");

const selfMarketing = parseCampaignIntake("Advertise ShopReel using ShopReel");
const selfAngles = generateDifferentiatedAngles({ title: "ShopReel", coreIdea: selfMarketing.sourcePrompt, parsedBrief: selfMarketing });
assert(selfAngles.length >= 3, "internal self-marketing should include at least 3 angles");
const selfPkg = buildProductionPackage("internal_self_marketing", "ShopReel Operator", "Operate like a pro", "Try ShopReel");
assert(JSON.stringify(selfPkg.sections).toLowerCase().includes("shopreel"), "self-marketing package should include ShopReel-specific positioning");

const fallbackAngles = generateDifferentiatedAngles({ title: "Legacy", coreIdea: "general growth ask" });
assert(fallbackAngles.length >= 4, "legacy campaign creation should still work without parsedBrief");
for (const fallbackAngle of fallbackAngles) {
  assert(fallbackAngle.title && fallbackAngle.hook, "fallback angle should include title/hook");
}

console.log("campaign-production-smoke passed");
