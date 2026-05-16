import { buildCampaignImagePrompt, buildCampaignVideoPrompt, deriveCampaignMediaState } from "../src/features/shopreel/campaigns/lib/mediaGeneration";
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
