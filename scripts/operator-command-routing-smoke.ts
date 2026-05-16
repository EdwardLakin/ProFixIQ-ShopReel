import assert from "node:assert/strict";

import { executeShopReelCommand } from "../src/features/shopreel/ui/system/executeShopReelCommand";
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
  assert.equal(result.handoffMethod, "session_storage", `Expected session handoff for: ${prompt}`);
  assert.ok(result.handoffId, `Expected handoff id for: ${prompt}`);
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

console.log("operator-command-routing-smoke: ok");
