import { parseCampaignIntake } from "../src/features/shopreel/campaigns/lib/parseCampaignIntake";
import { generateDifferentiatedAngles, buildProductionPackage } from "../src/features/shopreel/campaigns/lib/campaignIntelligence";

function assert(condition: unknown, msg: string) { if (!condition) throw new Error(msg); }

const business = parseCampaignIntake("I need facebook ads for my local HVAC business in Denver");
assert(business.mode === "business_advertising", "business mode expected");
const businessAngles = generateDifferentiatedAngles({ title: "HVAC Growth", coreIdea: business.sourcePrompt, parsedBrief: business });
assert(businessAngles.some((a) => a.angle === "local_trust"), "business-specific angle missing");

const launch = parseCampaignIntake("Launch our new productivity app next month");
const launchAngles = generateDifferentiatedAngles({ title: "Launch", coreIdea: launch.sourcePrompt, parsedBrief: launch });
assert(launchAngles.some((a) => a.angle === "category_problem"), "launch-specific angle missing");

const pkg = buildProductionPackage("business_advertising", "Local Trust", "Your neighbors trust us", "Book now");
assert(!!(pkg.sections as any).facebook_post, "package missing facebook_post");
assert(!!(pkg.sections as any).short_reel_script, "package missing short_reel_script");

const fallbackAngles = generateDifferentiatedAngles({ title: "Legacy", coreIdea: "general growth ask" });
assert(fallbackAngles.length >= 4, "legacy campaign creation should still work without parsedBrief");

console.log("campaign-production-smoke passed");
