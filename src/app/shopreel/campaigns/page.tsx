export const dynamic = "force-dynamic";
import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import SurfaceExecutionHint from "@/features/shopreel/ui/system/SurfaceExecutionHint";
import { ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default async function CampaignsPage() {
  return <GlassShell title="Campaigns" hidePageIntro><div className="space-y-4"><EcosystemStateRail surface="campaigns" /><SurfaceExecutionHint surface="campaigns" /><ShopReelSurface title="Campaign brief" description="Campaign setup is handled in the workspace flow to persist goals and lifecycle state."><p className="text-sm text-white/70">Use the campaign workspace to create a campaign with saved objective, audience, and execution lanes.</p><Link href="/shopreel/campaigns/new" className="mt-3 inline-block rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">Open campaign workspace</Link></ShopReelSurface><ShopReelSurface title="Active campaigns" description="Campaigns currently in progress."><p className="text-sm text-white/65">Open a campaign to review tasks and blocked items.</p><Link href="/shopreel/campaigns/new" className="mt-2 inline-block text-sm text-cyan-200">Open campaign workspace</Link></ShopReelSurface></div></GlassShell>;
}
