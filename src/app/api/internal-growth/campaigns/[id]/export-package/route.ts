import { NextResponse } from "next/server";
import { assertInternalGrowthAccess } from "@/features/internal-growth/server/guards";
import { getCampaignPackage } from "@/features/internal-growth/server/repository";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { await assertInternalGrowthAccess(); const pkg = await getCampaignPackage((await params).id); return NextResponse.json({ campaignBrief: pkg.campaign, drafts: pkg.drafts, captions: pkg.drafts, storyboard: pkg.assetPlans, screenshotRequests: pkg.screenshotRequests, renderCompositions: pkg.renderCompositions, renderReadiness: pkg.renderReadiness, brandKitReferences: pkg.brandKit, futurePublishPayload: pkg.futurePublishPayload }); }
