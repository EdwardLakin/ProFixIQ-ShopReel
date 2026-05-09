export const dynamic = "force-dynamic";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireShopId } from "@/features/shopreel/server/requireShopId";
import { mapExportPackage } from "@/features/shopreel/export/exportPackage";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { ShopReelActionRail, ShopReelEmptyState, ShopReelOperationalLanes, ShopReelPageHero, ShopReelSectionHeader, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";
import EcosystemStateRail from "@/features/shopreel/ui/system/EcosystemStateRail";
import SurfaceExecutionHint from "@/features/shopreel/ui/system/SurfaceExecutionHint";
import { computePublishReadiness } from "@/features/shopreel/publish/lifecycle";

export default async function ShopReelDownloadsPage() {
  const shopId = await requireShopId();
  const supabase = createAdminClient();
  const { data } = await supabase.from("shopreel_export_packages").select("*").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(100);
  const items = (data ?? []).map(mapExportPackage);

  const groups = {
    readyToPackage: items.filter((pkg) => pkg.status === "draft" && pkg.mp4Path),
    needsReview: items.filter((pkg) => pkg.status === "draft" && !pkg.mp4Path),
    draft: items.filter((pkg) => pkg.status === "ready"),
    exported: items.filter((pkg) => pkg.status === "exported" || pkg.status === "posted"),
  };

  const renderList = (list: typeof items) => list.length === 0 ? <ShopReelEmptyState title="No packages" description="Completed renders with real output can be converted into publish packages." /> : <div className="grid gap-2">{list.map((pkg) => {
    const readiness = computePublishReadiness({
      videoUrl: pkg.mp4Path,
      thumbnailUrl: pkg.thumbnailPath,
      captionText: pkg.captionText,
      title: undefined,
      description: undefined,
      hashtags: pkg.hashtags,
      targets: pkg.platformOutputs.map((output) => ({ platformId: output.platformId, label: output.platformId })),
    });
    return <article key={pkg.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/80">
      <div className="flex items-center justify-between"><p className="font-medium text-white">Package {pkg.id.slice(0, 8)}</p><p className="text-xs text-white/60">{pkg.status}</p></div>
      <p className="mt-1 text-xs text-white/65">Readiness: {readiness.status} · blockers {readiness.blockerCount} · warnings {readiness.warningCount}</p>
      <p className="mt-1 text-xs text-white/65">Video: {pkg.mp4Path ? "available" : "missing"} · Thumbnail: {pkg.thumbnailPath ? "available" : "missing"} · Caption: {pkg.captionText ? "available" : "missing"}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <Link href={`/shopreel/exports/${pkg.id}`} className="text-cyan-200">Open package</Link>
        {pkg.captionText ? <button type="button" className="text-violet-200">Copy caption</button> : null}
        {pkg.hashtags.length ? <button type="button" className="text-violet-200">Copy hashtags</button> : null}
        {pkg.mp4Path ? <a className="text-emerald-200" href={pkg.mp4Path} target="_blank">Download video</a> : null}
      </div>
    </article>;
  })}</div>;

  return <GlassShell title="Publish / Export" hidePageIntro>
    <div className="space-y-4">
      <EcosystemStateRail surface="publish" />
      <SurfaceExecutionHint surface="publish" />
      <ShopReelPageHero title="Publish workspace" subtitle="Package completed render outputs with deterministic readiness before export." actions={[{ label: "Create content", href: "/shopreel/create", primary: true }, { label: "Open render queue", href: "/shopreel/render-queue" }]} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <ShopReelSectionHeader eyebrow="Package board" title="Export command center" subtitle="Validate readiness, open package details, and run manual publishing workflows." />
          <ShopReelOperationalLanes>
            <div className="min-w-[min(100%,25rem)] flex-1"><ShopReelSurface title="Ready to package" prominence={groups.readyToPackage.length ? "elevated" : "normal"}>{renderList(groups.readyToPackage)}</ShopReelSurface></div>
            <div className="min-w-[min(100%,25rem)] flex-1"><ShopReelSurface title="Needs review" prominence={groups.needsReview.length ? "elevated" : "normal"} density={groups.needsReview.length > 5 ? "compact" : "balanced"}>{renderList(groups.needsReview)}</ShopReelSurface></div>
            <div className="min-w-[min(100%,25rem)] flex-1"><ShopReelSurface title="Draft packages" density="compact">{renderList(groups.draft)}</ShopReelSurface></div>
            <div className="min-w-[min(100%,25rem)] flex-1"><ShopReelSurface title="Exported packages" prominence={groups.exported.length ? "recessed" : "normal"} density="compact">{renderList(groups.exported)}</ShopReelSurface></div>
          </ShopReelOperationalLanes>
        </div>
        <ShopReelActionRail title="Publish rail" items={["Start with packages that are readiness=ready","Resolve blockers before downloading deliverables","Use package detail before copying captions/hashtags","Exported and posted statuses reflect persisted package state"]} />
      </div>
    </div>
  </GlassShell>;
}
