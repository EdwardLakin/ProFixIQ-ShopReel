import { buildCampaignImagePrompt, buildCampaignVideoPrompt, getCampaignMediaStage } from "../src/features/shopreel/campaigns/lib/mediaGeneration";

function assert(condition: unknown, msg: string) { if (!condition) throw new Error(msg); }

const campaign = { title: "Mobile Mechanic Launch", core_idea: "Fast local mobile mechanic trust-first ads" };
const item = { title: "Book same-day mechanic", angle: "Trustworthy emergency roadside help" };
const productionPackage = { sections: { short_reel_script: ["Scene 1 hook", "Scene 2 service", "Scene 3 trust", "Scene 4 process", "Scene 5 CTA"] } };
const parsedBrief = { serviceCategory: "mobile mechanic service", location: "Calgary", bookingAction: "Call now" };

const imagePrompt = buildCampaignImagePrompt({ campaign, item, productionPackage, parsedBrief });
assert(imagePrompt.includes("Calgary"), "image prompt should include location context");
assert(imagePrompt.includes("9:16"), "image prompt should include vertical format");

let threw = false;
try {
  buildCampaignVideoPrompt({ campaign, item, productionPackage, imageAsset: { id: "x", public_url: null } });
} catch (error) {
  threw = (error as Error).message.includes("Generate an image before creating video.");
}
assert(threw, "video prompt builder should guard when image is missing");

const videoPrompt = buildCampaignVideoPrompt({ campaign, item, productionPackage, imageAsset: { id: "asset-1", public_url: "https://example.com/frame.png" } });
assert(videoPrompt.includes("5 concise scenes"), "video prompt should include 5-scene direction");
assert(videoPrompt.includes("start/reference frame"), "video prompt should require reference image");

const stageA = getCampaignMediaStage({ packageApproved: false, imageAssetId: null, imagePreviewUrl: null, videoJobId: null });
assert(!stageA.imageEnabled && !stageA.videoEnabled, "before package approval both actions disabled");
const stageB = getCampaignMediaStage({ packageApproved: true, imageAssetId: null, imagePreviewUrl: null, videoJobId: null });
assert(stageB.imageEnabled && !stageB.videoEnabled, "after package approval image enabled, video disabled");
const stageC = getCampaignMediaStage({ packageApproved: true, imageAssetId: "asset-1", imagePreviewUrl: "https://example.com/frame.png", videoJobId: null });
assert(stageC.videoEnabled, "video should unlock once image exists");
const stageD = getCampaignMediaStage({ packageApproved: true, imageAssetId: "asset-1", imagePreviewUrl: "https://example.com/frame.png", videoJobId: "job-1" });
assert(stageD.videoEnabled && stageD.helper.includes("Video job"), "video status stage should be detected");

console.log("campaign-media-smoke passed");
