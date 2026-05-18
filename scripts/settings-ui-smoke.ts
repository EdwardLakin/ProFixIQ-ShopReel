import { readFileSync } from "node:fs";

const settingsSource = readFileSync("src/features/shopreel/ui/ShopReelSettingsClient.tsx", "utf8");

const mustInclude = [
  'id="connections"',
  'title="Brand voice"',
  'title="Campaign strategy"',
  'title="Visual generation"',
  'title="Publishing defaults"',
  'How ShopReel uses these settings',
  'Only available when publish queue/live publishing is fully configured.',
  'Claims ShopReel should avoid. One per line.',
  'Calls-to-action ShopReel should prefer. One per line. Example: Message to book.',
];

for (const text of mustInclude) {
  if (!settingsSource.includes(text)) {
    throw new Error(`Missing expected settings UX text: ${text}`);
  }
}

console.log("settings-ui-smoke: ok");
