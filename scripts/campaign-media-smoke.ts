import { buildCampaignImagePrompt, buildCampaignVideoPrompt, deriveCampaignMediaState, mergeLiveJobIntoMediaMetadata, readMediaMetadata } from "../src/features/shopreel/campaigns/lib/mediaGeneration";
function assert(condition: unknown, msg: string) { if (!condition) throw new Error(msg); }
const campaign = { title: "Mobile Mechanic Launch", core_idea: "Fast local mobile mechanic trust-first ads" };
const item = { title: "Book same-day mechanic", angle: "Trustworthy emergency roadside help" };
const productionPackage = { sections: { short_reel_script: ["Scene 1 hook"] } };
const parsedBrief = { serviceCategory: "mobile mechanic service", location: "Calgary", bookingAction: "Call now" };
assert(buildCampaignImagePrompt({ campaign, item, productionPackage, parsedBrief, purpose: "static_ad" }).includes("static social ad image"),"prompt ok");
assert(buildCampaignImagePrompt({ campaign, item, productionPackage, parsedBrief, purpose: "video_reference" }).includes("first/reference frame"),"reference prompt ok");
let threw=false; try { buildCampaignVideoPrompt({ campaign,item,productionPackage,imageAsset:{public_url:null} }); } catch { threw=true; } assert(threw,"video prompt should guard missing image");

const baseImg={
jobId:null,status:"not_started" as const,provider:null,previewUrl:null,outputAssetId:null,errorText:null,jobHref:null,requestedAt:null,updatedAt:null,purpose:"static_ad" as const};
const baseVid={jobId:null,status:"not_started" as const,provider:null,previewUrl:null,outputAssetId:null,errorText:null,jobHref:null,requestedAt:null,updatedAt:null};
assert(deriveCampaignMediaState({packageApproved:true,image:baseImg,video:baseVid}).stage==="ready_for_image","no image job -> not started");
assert(deriveCampaignMediaState({packageApproved:true,image:{...baseImg,jobId:"j1",status:"queued"},video:baseVid}).helperText.includes("queued"),"queued helper");
assert(!deriveCampaignMediaState({packageApproved:true,image:{...baseImg,jobId:"j1",status:"processing"},video:baseVid}).helperText.includes("starting frame"),"processing keeps video disabled");
assert(deriveCampaignMediaState({packageApproved:true,image:{...baseImg,jobId:"j1",status:"completed",previewUrl:"https://x"},video:baseVid}).stage==="ready_for_video","completed enables video");
assert(deriveCampaignMediaState({packageApproved:true,image:{...baseImg,jobId:"j1",status:"failed",errorText:"oops"},video:baseVid}).nextActionLabel==="Retry image","failed shows retry");
assert(deriveCampaignMediaState({packageApproved:true,image:{...baseImg,jobId:"j1",status:"completed",previewUrl:"https://x"},video:{...baseVid,jobId:"v1",status:"queued"}}).stage==="video_in_progress","video queued visible");
assert(deriveCampaignMediaState({packageApproved:true,image:{...baseImg,jobId:"j1",status:"queued"},video:baseVid}).nextActionLabel==="Open image job","duplicate queued should not suggest new image job");
console.log("campaign-media-smoke passed");


const completedNoPreview = deriveCampaignMediaState({
  packageApproved:true,
  image:{...baseImg,jobId:"j1",status:"completed",previewUrl:null,outputAssetId:null},
  video:baseVid
});
assert(completedNoPreview.stage==="ready_for_image","completed without preview remains blocked");
const completedWithPreview = deriveCampaignMediaState({
  packageApproved:true,
  image:{...baseImg,jobId:"j1",status:"completed",previewUrl:"https://img"},
  video:baseVid
});
assert(completedWithPreview.stage==="ready_for_video","completed with preview unlocks video");


const failedState = deriveCampaignMediaState({
  packageApproved:true,
  image:{...baseImg,jobId:"j1",status:"failed",errorText:"Provider timeout"},
  video:baseVid
});
assert(failedState.nextActionLabel==="Retry image","failed state keeps retry action");

const reconciled = mergeLiveJobIntoMediaMetadata({ media: { image_job_id: "j1", image_status: "queued" } }, {
  status: "completed",
  preview_url: "https://img.example/preview.png",
  output_asset_id: "asset-1",
  completed_at: "2026-05-17T00:00:00.000Z",
});
const reconciledMedia = readMediaMetadata(reconciled);
assert(reconciledMedia.imageStatus === "completed", "reconcile updates queued->completed");
assert(reconciledMedia.imagePreviewUrl === "https://img.example/preview.png", "reconcile stores preview");
assert(reconciledMedia.imageAssetId === "asset-1", "reconcile stores output asset id");
