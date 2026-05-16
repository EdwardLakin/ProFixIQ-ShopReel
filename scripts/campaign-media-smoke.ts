import { buildCampaignImagePrompt, buildCampaignVideoPrompt, getCampaignMediaStage } from "../src/features/shopreel/campaigns/lib/mediaGeneration";

function assert(condition: unknown, msg: string) { if (!condition) throw new Error(msg); }

const campaign = { title: "Mobile Mechanic Launch", core_idea: "Fast local mobile mechanic trust-first ads" };
const item = { title: "Book same-day mechanic", angle: "Trustworthy emergency roadside help" };
const productionPackage = { sections: { short_reel_script: ["Scene 1 hook", "Scene 2 service", "Scene 3 trust", "Scene 4 process", "Scene 5 CTA"] } };
const parsedBrief = { serviceCategory: "mobile mechanic service", location: "Calgary", bookingAction: "Call now" };

const imagePrompt = buildCampaignImagePrompt({ campaign, item, productionPackage, parsedBrief, purpose: "static_ad" });
assert(imagePrompt.includes("local-business"), "image prompt should include local-business context");
assert(imagePrompt.includes("static social ad image"), "static ad prompt should include social ad intent");
const referencePrompt = buildCampaignImagePrompt({ campaign, item, productionPackage, parsedBrief, purpose: "video_reference" });
assert(referencePrompt.includes("first/reference frame"), "video reference prompt should include first/reference frame intent");

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

const stageA = getCampaignMediaStage({ packageApproved: false, imagePurpose: "static_ad", imageAssetId: null, imagePreviewUrl: null, uploadedReferenceUrl: null, videoJobId: null });
assert(!stageA.imageEnabled && !stageA.videoEnabled, "before package approval both actions disabled");
const stageB = getCampaignMediaStage({ packageApproved: true, imagePurpose: "static_ad", imageAssetId: null, imagePreviewUrl: null, uploadedReferenceUrl: null, videoJobId: null });
assert(stageB.imageEnabled && !stageB.videoEnabled, "after package approval image enabled, video disabled");
const stageC = getCampaignMediaStage({ packageApproved: true, imagePurpose: "static_ad", imageAssetId: "asset-1", imagePreviewUrl: "https://example.com/frame.png", uploadedReferenceUrl: null, videoJobId: null });
assert(stageC.videoEnabled, "video should unlock once image exists");
const stageD = getCampaignMediaStage({ packageApproved: true, imagePurpose: "video_reference", imageAssetId: "asset-1", imagePreviewUrl: "https://example.com/frame.png", uploadedReferenceUrl: null, videoJobId: "job-1" });
assert(stageD.videoEnabled && stageD.helper.includes("Video job"), "video status stage should be detected");
const stageE = getCampaignMediaStage({ packageApproved: true, imagePurpose: "uploaded_reference", imageAssetId: null, imagePreviewUrl: null, uploadedReferenceUrl: "https://example.com/uploaded.png", videoJobId: null });
assert(stageE.videoEnabled, "uploaded reference should unlock video");

console.log("campaign-media-smoke passed");
