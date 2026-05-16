import assert from "node:assert/strict";
import { parseCampaignIntake } from "../src/features/shopreel/campaigns/lib/parseCampaignIntake";
import { buildCampaignFormDefaultsFromParsedBrief, emptyCampaignFormDefaults } from "../src/features/shopreel/campaigns/lib/campaignFormDefaults";

const prompt = "I’m starting a mobile mechanic business in Calgary and need Facebook ads";
const brief = parseCampaignIntake(prompt);
const mapped = buildCampaignFormDefaultsFromParsedBrief(brief, prompt);
assert.equal(brief.mode, "business_advertising");
assert.match(mapped.title.toLowerCase(), /(mobile mechanic|calgary|local business)/);
assert.match(mapped.audience.toLowerCase(), /(local|customer)/);
assert.match(mapped.campaignGoal.toLowerCase(), /(bookings|customers)/);
assert.match(mapped.platformFocus.toLowerCase(), /facebook/);
assert.equal(mapped.coreIdea, prompt);
assert.notEqual(mapped.title, "ShopReel vs Traditional Marketing");

const internal = parseCampaignIntake("Advertise ShopReel using ShopReel");
const internalMapped = buildCampaignFormDefaultsFromParsedBrief(internal, internal.sourcePrompt);
assert.equal(internalMapped.title, "ShopReel vs Traditional Marketing");

const blank = emptyCampaignFormDefaults();
assert.equal(blank.title, "");
assert.equal(blank.coreIdea, "");
console.log("campaign-form-defaults-smoke: ok");
