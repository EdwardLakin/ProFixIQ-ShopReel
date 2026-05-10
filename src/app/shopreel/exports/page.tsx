export const dynamic = "force-dynamic";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import SurfaceExecutionHint from "@/features/shopreel/ui/system/SurfaceExecutionHint";
import { ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

export default function ExportsPage() {
  return <GlassShell title="Exports" hidePageIntro><div className="space-y-4"><EcosystemStateRail surface="publish" /><SurfaceExecutionHint surface="publish" /><ShopReelSurface title="Ready assets" description="Package and publish approved outputs."><button className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950">Package export</button></ShopReelSurface><ShopReelSurface title="Blocked publications" description="Resolve these before publish."><p className="text-sm text-white/65">No blocked publications.</p></ShopReelSurface><details className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70"><summary className="cursor-pointer">System details</summary><p className="mt-2 text-xs">View routing details and destination diagnostics only when needed.</p></details></div></GlassShell>;
}
