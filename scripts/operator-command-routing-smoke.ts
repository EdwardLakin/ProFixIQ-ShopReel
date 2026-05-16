import assert from "node:assert/strict";

import { executeShopReelCommand } from "../src/features/shopreel/ui/system/executeShopReelCommand";
import { classifyCommandInputIntent, isLikelyCampaignPrompt } from "../src/features/shopreel/ui/system/commandInputIntent";
import { resolveRouteFromPrompt } from "../src/features/shopreel/ui/system/shopReelRouteRegistry";
import { createCampaignCommandHandoff } from "../src/features/shopreel/ui/system/campaignCommandHandoff";
import type { OperatorWorldCard } from "../src/features/shopreel/operator/operatorWorlds";

const CREATE_PROMPTS = [
  "I'm starting a mobile mechanic business in Calgary and need Facebook ads",
  "Help me advertise my detailing business",
  "Launch Moment by ProFixIQ",
  "Give me a week of posts for my landscaping business",
  "Advertise ShopReel using ShopReel",
  "Create ads for my new bakery",
];

for (const prompt of CREATE_PROMPTS) {
  const result = executeShopReelCommand({ command: prompt, source: "home_command" });
  assert.equal(result.commandIntent, "create_campaign", `Expected create_campaign intent for: ${prompt}`);
  assert.ok(result.selectedRoute.startsWith("/shopreel/campaigns/new?mode=create&handoff="), `Expected campaign handoff route for: ${prompt}`);
}

const recentWorlds: OperatorWorldCard[] = [
  {
    id: "cmp_1",
    kind: "campaign",
    title: "Spring campaign",
    status: "pending_review",
    normalizedStatus: "pending_review",
    stageLabel: "Review approvals",
    actionLabel: "Review now",
    priority: "high",
    href: "/shopreel/review",
    sourceLabel: "campaign",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const review = executeShopReelCommand({ command: "review approvals", source: "home_command", recentWorlds });
assert.equal(review.selectedRoute, "/shopreel/review");

const render = executeShopReelCommand({ command: "open render queue", source: "home_command", recentWorlds: [] });
assert.equal(render.selectedRoute, "/shopreel/render-queue");

const settings = executeShopReelCommand({ command: "open settings", source: "home_command" });
assert.equal(settings.selectedRoute, "/shopreel/settings");

assert.equal(classifyCommandInputIntent("   "), "unknown");
assert.equal(resolveRouteFromPrompt("   ").route, "/shopreel");

const mechanicPrompt = "I'm starting a mobile mechanic business in Calgary and need Facebook ads";
const mechanic = executeShopReelCommand({ command: mechanicPrompt, source: "home_command" });
assert.match(mechanic.selectedRoute, /^\/shopreel\/campaigns\/new\?mode=create&handoff=/);
assert.equal(isLikelyCampaignPrompt(mechanicPrompt), true);

const originalWindow = (globalThis as Record<string, unknown>).window;
const throwingStorage = {
  getItem() { throw new Error("storage denied"); },
  setItem() { throw new Error("storage denied"); },
  removeItem() { throw new Error("storage denied"); },
};

(globalThis as Record<string, unknown>).window = { sessionStorage: throwingStorage };
const noStorageHandoff = createCampaignCommandHandoff({ prompt: mechanicPrompt, source: "home_command" });
assert.ok(noStorageHandoff.id.startsWith("ccm_"));
const fallbackRoute = `/shopreel/campaigns/new?mode=create&handoff=${encodeURIComponent(noStorageHandoff.id)}`;
assert.ok(fallbackRoute.startsWith("/shopreel/campaigns/new?mode=create&handoff="));
(globalThis as Record<string, unknown>).window = originalWindow;

console.log("operator-command-routing-smoke: ok");
