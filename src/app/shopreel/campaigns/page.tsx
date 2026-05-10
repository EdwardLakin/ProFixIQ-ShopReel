export const dynamic = "force-dynamic";
import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import SurfaceExecutionHint from "@/features/shopreel/ui/system/SurfaceExecutionHint";
import { ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default async function CampaignsPage() {
  return <GlassShell title="Campaigns" hidePageIntro><div className="space-y-4"><EcosystemStateRail surface="campaigns" /><SurfaceExecutionHint surface="campaigns" /><ShopReelSurface title="Campaign brief" description="Define goals and destinations."><div className="grid gap-2 md:grid-cols-2"><input className="rounded-lg border border-white/15 bg-black/20 p-2 text-sm" placeholder="Campaign name" /><input className="rounded-lg border border-white/15 bg-black/20 p-2 text-sm" placeholder="Objective" /></div><button className="mt-3 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">Create campaign</button></ShopReelSurface><ShopReelSurface title="Active campaigns" description="Campaigns currently in progress."><p className="text-sm text-white/65">Open a campaign to review tasks and blocked items.</p><Link href="/shopreel/campaigns/new" className="mt-2 inline-block text-sm text-cyan-200">Open campaign workspace</Link></ShopReelSurface></div></GlassShell>;
}
