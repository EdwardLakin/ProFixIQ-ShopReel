import { parseCampaignIntake } from "../src/features/shopreel/campaigns/lib/parseCampaignIntake";

const prompts = [
  "I’m starting a mobile mechanic business in Calgary and need Facebook ads",
  "Launch Moment by ProFixIQ",
  "Give me a week of posts for my detailing business",
  "Turn this uploaded before and after photo into content",
  "Make this ad less generic",
  "Schedule approved posts for next week",
  "Advertise ShopReel using ShopReel",
];

for (const prompt of prompts) {
  const brief = parseCampaignIntake(prompt);
  console.log(`prompt=${prompt}`);
  console.log(`mode=${brief.mode} confidence=${brief.confidence} location=${brief.location ?? "n/a"} businessType=${brief.businessType ?? "n/a"}`);
  console.log(`desiredOutputs=${brief.desiredOutputs.join(",")}`);
  console.log("---");
}
