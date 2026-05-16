import { parseCampaignIntake } from "../src/features/shopreel/campaigns/lib/parseCampaignIntake";

const prompts = [
  "I’m starting a mobile mechanic business in Calgary and need Facebook ads",
  "I do mobile detailing and need posts to get bookings",
  "I’m opening a small bakery and need local ads",
  "Help me promote my landscaping business on Facebook",
  "Launch Moment by ProFixIQ",
];

for (const prompt of prompts) {
  const brief = parseCampaignIntake(prompt);
  console.log(`prompt=${prompt}`);
  console.log(`mode=${brief.mode} confidence=${brief.confidence} location=${brief.location ?? "n/a"} businessType=${brief.businessType ?? "n/a"} serviceCategory=${brief.serviceCategory ?? "n/a"}`);
  console.log(`desiredOutputs=${brief.desiredOutputs.join(",")}`);
  console.log(`missingQuestions=${brief.missingQuestions.join(" | ") || "none"}`);
  console.log("---");
}
